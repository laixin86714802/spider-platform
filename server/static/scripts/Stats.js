var Stats = function (options) {

	if (options === undefined) {
		options = {};
	}

	this.extensionIsBeingUsedCheckIntervalTime = options.checkInterval || 30;
	this.store = options.store;
	this.config = options.config;

	// a dict of date=>timestamp values of the time when extension was started used
	this.usageStartTimes = {};

	var day = 1000 * 60 * 60 * 24;
	this.randomFirstReportInMs = options.randomFirstReportInMs || 2 * day;
	this.reportInMs = options.reportInMs || 3 * day;
	this.potentialSubmitIntervalMs = options.potentialSubmitIntervalMs || 5*60e3;
};

var statsReporterInterval;

Stats.prototype = {

	getDate: function (time) {

		var d;
		if (time === undefined) {
			d = new Date();
		}
		else {
			d = new Date(time);
		}

		var month = ("0"+(d.getMonth()+1)).substr(-2);
		var day = ("0"+d.getDate()).substr(-2);

		return d.getFullYear() + '-' + month + '-' + day;
	},

	initStats: function () {

		return this.initIndexedDbConnection()
			.then(function () {
				return this.getLastTimeStatsReported();
			}.bind(this))
			.then(function (lastTimeStatsReported) {
				this.lastTimeStatsReported = lastTimeStatsReported;
			}.bind(this))
			.then(function () {
				return this.getStatId();
			}.bind(this))
			.then(function (statId) {
				this.statId = statId;
			}.bind(this))
			.then(function () {
				return this.initDailyStats();
			}.bind(this));
	},

	initIndexedDbConnection: function () {

		var d = $.Deferred();

		var request = window.indexedDB.open("WebScraperStats", 1);

		// Create the schema
		request.onupgradeneeded = function () {
			var db = request.result;
			var store = db.createObjectStore("Stats", {keyPath: "id"});
		};

		request.onerror = function (event) {
			d.reject("Database error: " + event.target.errorCode);
		};
		request.onsuccess = function (event) {
			this.indexedDb = event.target.result;
			d.resolve();
		}.bind(this);

		return d.promise();
	},

	indexedDbPut: function (key, value) {

		var d = $.Deferred();

		var tx = this.indexedDb.transaction("Stats", "readwrite");
		var store = tx.objectStore("Stats");
		var request = store.put({
			id: key,
			data: value
		});

		request.onerror = function (event) {
			d.reject("Database put error: " + event.target.errorCode);
		};
		request.onsuccess = function (event) {
			d.resolve();
		};

		return d.promise();
	},

	indexedDbGet: function (key) {

		var d = $.Deferred();

		var tx = this.indexedDb.transaction("Stats", "readwrite");
		var store = tx.objectStore("Stats");
		var request = store.get(key);

		request.onerror = function (event) {
			d.reject("Database get error: " + event.target.errorCode);
		};
		request.onsuccess = function (event) {
			var result = event.target.result;
			if (result !== undefined && result.data !== undefined) {
				d.resolve(result.data);
			}
			else {
				d.resolve({});
			}
		};

		return d.promise();
	},

	indexedDbDelete: function (key) {

		var d = $.Deferred();

		var tx = this.indexedDb.transaction("Stats", "readwrite");
		var store = tx.objectStore("Stats");
		var request = store.delete(key);

		request.onerror = function (event) {
			d.reject("Database delete error: " + event.target.errorCode);
		};
		request.onsuccess = function (event) {
			d.resolve();
		};

		return d.promise();
	},

	initDailyStats: function () {
		// var deferredResponse = $.Deferred();

		return this.indexedDbGet('daily_stats').then(function (dailyStats) {

			this.dailyStats = dailyStats;

			// init today's date

			var date = this.getDate();
			this.initDailyStatDate(date);

		}.bind(this)).then(this.updateDailyStats.bind(this));
	},

	initDailyStatDate: function (date) {
		if (this.dailyStats[date] === undefined) {
			this.dailyStats[date] = {
				"statId" : this.statId,
				"date": date,
				"scrapingJobsRun": 0,
				"pagesScraped": 0,
				"sitemapsCreated": 0,
				"sitemapsDeleted": 0,
				"sitemapsImported": 0,
				"webScraperOpened": false,
				"webScraperUsageMinutes": 0
			}
		}
	},

	getDailyStats: function () {

		var currentDate = this.getDate();

		var dailyStats = this.dailyStats;
		var dailyStatsArray = [];
		for (var date in dailyStats) {
			// do not report current date because we are still updating
			if (date.match(/\d+\-\d+\-\d+/) && date !== currentDate) {
				dailyStatsArray.push(dailyStats[date]);
			}
		}
		return dailyStatsArray;
	},

	setDailyStat: function (key, value) {

		var date = this.getDate();
		this.initDailyStatDate(date);
		this.dailyStats[date][key] = value;
		return this.updateDailyStats();
	},

	incrementDailyStat: function (key, increment) {

		if (increment === undefined) {
			increment = 1;
		}

		var date = this.getDate();
		this.initDailyStatDate(date);
		if(!this.dailyStats[date][key]) {
			this.dailyStats[date][key] = 0;
		}
		this.dailyStats[date][key] += increment;
		return this.updateDailyStats();
	},

	updateExtensionIsBeingUsed: function () {

		var date = this.getDate();

		var unixTime = Math.round(Date.now() / 1000);

		if (this.usageStartTimes[date] === undefined) {
			this.usageStartTimes[date] = {
				'timeStarted': unixTime,
				'lastUpdated': unixTime,
				'checkInterval': null
			};
			this.startExtensionIsBeingUsedCheckInterval(date);
		}
		else {
			this.usageStartTimes[date].lastUpdated = unixTime;
		}
	},

	// check every 30 seconds whether web scraper usage
	startExtensionIsBeingUsedCheckInterval: function (date) {

		// wait for a moment when extension isn't being used
		this.usageStartTimes[date].checkInterval = setInterval(function () {
			var unixTime = Math.round(Date.now() / 1000);
			// debugger;
			if (this.usageStartTimes[date]['lastUpdated'] + 65 < unixTime) {
				console.log("extension usage ended");


				var usageDuration = Math.round((unixTime - this.usageStartTimes[date].timeStarted) / 60);
				this.incrementDailyStat("webScraperUsageMinutes", usageDuration);

				clearInterval(this.usageStartTimes[date].checkInterval);
				delete this.usageStartTimes[date];
			}
		}.bind(this), this.extensionIsBeingUsedCheckIntervalTime * 1000)
	},

	/**
	 * Store daly stats in db
	 */
	updateDailyStats: function () {

		return this.indexedDbPut('daily_stats', this.dailyStats);
	},

	getDatabaseStats: function () {

		var $deferredResponse = $.Deferred();
		var store = this.store;
		store.getAllSitemaps(function (sitemaps) {

			sitemaps = sitemaps.map(function (sitemap) {
				return new Sitemap(sitemap);
			});

			var domainDict = [];
			var deferredDatabaseSizes = [];

			var couchDbUsed = this.config.storageType !== 'local';

			var stats = {
				"statId": this.statId,
				"couchDBUsed": couchDbUsed,
				"sitemapCount": 0,
				"selectorCountPerSitemap": {
					"1-1": 0,
					"2-5": 0,
					"6-10": 0,
					"11+": 0
				},
				"startUrlCountPerSitemap": {
					"1-1": 0,
					"2-5": 0,
					"6-10": 0,
					"11-50": 0,
					"51-200": 0,
					"201-500": 0,
					"501-1000": 0,
					"1001-5000": 0,
					"5001+": 0
				},
				"selectorUsageCount": {
					"SelectorElement": 0,
					"SelectorElementAttribute": 0,
					"SelectorElementClick": 0,
					"SelectorElementScroll": 0,
					"SelectorGroup": 0,
					"SelectorHTML": 0,
					"SelectorImage": 0,
					"SelectorLink": 0,
					"SelectorPopupLink": 0,
					"SelectorTable": 0,
					"SelectorText": 0
				},
				"datasetSizes": {
					"1-1": 0,
					"2-5": 0,
					"6-10": 0,
					"11-50": 0,
					"51-200": 0,
					"201-500": 0,
					"501-1000": 0,
					"1001-5000": 0,
					"5001-10000": 0,
					"10001+": 0
				},
				"startUrlDomains": []
			};


			function increaseStatGroup(group, value) {

				var statGroups = {
					"selectorCountPerSitemap": {
						"1-1": {min: 1, max: 1},
						"2-5": {min: 2, max: 5},
						"6-10": {min: 6, max: 10},
						"11+": {min: 1, max: 2147483647}
					},
					"startUrlCountPerSitemap": {
						"1-1": {min: 1, max: 1},
						"2-5": {min: 2, max: 5},
						"6-10": {min: 6, max: 10},
						"11-50": {min: 11, max: 50},
						"51-200": {min: 51, max: 200},
						"201-500": {min: 201, max: 500},
						"501-1000": {min: 501, max: 1000},
						"1001-5000": {min: 1000, max: 5000},
						"5001+": {min: 5001, max: 2147483647}
					},
					"datasetSizes": {
						"1-1": {min: 1, max: 1},
						"2-5": {min: 2, max: 5},
						"6-10": {min: 6, max: 10},
						"11-50": {min: 11, max: 50},
						"51-200": {min: 51, max: 200},
						"201-500": {min: 201, max: 500},
						"501-1000": {min: 501, max: 1000},
						"1001-5000": {min: 1000, max: 5000},
						"5001-10000": {min: 5001, max: 10000},
						"10001+": {min: 10001, max: 2147483647}
					}
				};

				for (var statGroup in statGroups[group]) {
					var limiter = statGroups[group][statGroup];
					if (value >= limiter.min && value <= limiter.max) {
						stats[group][statGroup]++;
						break;
					}
				}
			}

			stats.sitemapCount = sitemaps.length;

			sitemaps.forEach(function (sitemap) {

				// selector counter
				var selectorCount = sitemap.selectors.length;
				increaseStatGroup("selectorCountPerSitemap", selectorCount);

				// selector usage counter
				sitemap.selectors.forEach(function (selector) {
					stats.selectorUsageCount[selector.type]++;
				});

				// start url count
				var startUrls = sitemap.getStartUrls();
				var startUrlCount = startUrls.length;
				increaseStatGroup("startUrlCountPerSitemap", startUrlCount);
				var matches = startUrls[0].match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
				if (matches) {
					domainDict[matches[1]] = true;
				}

				// gather database size
				deferredDatabaseSizes.push(function () {

					var $deferred = $.Deferred();

					store.getSitemapData(sitemap, function (data) {
						var documentCount = data.length;
						$deferred.resolve(documentCount);
					});

					return $deferred.promise();
				});
			});

			for (var domain in domainDict) {
				stats.startUrlDomains.push(domain);
			}

			// gather database sizes
			$.whenCallSequentially(deferredDatabaseSizes).done(function (databaseSizes) {

				databaseSizes.forEach(function (databaseSize) {
					increaseStatGroup("datasetSizes", databaseSize);
				});
				$deferredResponse.resolve(stats);
			}).fail(function () {

			});


		}.bind(this));

		return $deferredResponse.promise();
	},

	getStats: function () {

		return this.getDatabaseStats().then(function (databaseStats) {
			var dailyStats = this.getDailyStats();
			return {
				databaseStats: databaseStats,
				dailyStats: dailyStats
			};
		}.bind(this));
	},

	getLastTimeStatsReported: function () {

		return this.indexedDbGet("reporter").then(function (doc) {

			if (doc.timeLastReported !== undefined) {
				return doc.timeLastReported;
			}

			// first time fetching the time. generate a random moment when stats
			// were reported
			var time = Date.now();
			var timeLastReported = Math.round(time - Math.random() * this.randomFirstReportInMs);

			// store the random time in db
			return this.setLastTimeStatsReported(timeLastReported).then(function () {
				return time;
			});
		}.bind(this));
	},

	setLastTimeStatsReported: function (time) {

		this.lastTimeStatsReported = time;

		// store this in db
		return this.indexedDbPut('reporter', {
			timeLastReported: time
		});
	},

	getStatId: function () {

		return this.indexedDbGet("statId").then(function (doc) {

			// already was in db
			if (doc.statId !== undefined) {
				return doc.statId;
			}

			// first time fetching. generate a random string
			var statId = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

			for (var i = 1; i <= 60; i++) {
				statId += possible.charAt(Math.floor(Math.random() * possible.length));
			}

			// store this in db
			return this.indexedDbPut('statId', {
				statId: statId
			}).then(function () {
				return statId;
			}.bind(this));
		}.bind(this));
	},

	initReporter: function () {

		var day = 1000 * 60 * 60 * 24;

		this.stopReporter();

		// start submission engine
		statsReporterInterval = setInterval(function () {

			// check whether we need to report stats
			var time = Date.now();
			if (this.lastTimeStatsReported + this.reportInMs >= time) {
				return;
			}

			// now is the time to report stats
			this.reportStats()
				.then(function () {
					// update stats have been reported
					var lastTimeStatsReported = Date.now();
					return this.setLastTimeStatsReported(lastTimeStatsReported);
				}.bind(this))
				.then(function () {
					// reset daily stats
					this.resetDailyStats();
				}.bind(this))

		}.bind(this), this.potentialSubmitIntervalMs);
	},

	stopReporter: function () {

		clearInterval(statsReporterInterval);
	},

	resetDailyStats: function () {

		var currentDate = this.getDate();

		var dailyStats = this.dailyStats;
		for (var date in dailyStats) {
			// do not report current date because we are still updating
			if (date.match(/\d+\-\d+\-\d+/) && date !== currentDate) {
				delete dailyStats[date];
			}
		}

		return this.updateDailyStats();
	},

	reportStats: function () {

		var d = $.Deferred();

		this.getStats().then(function (stats) {
			$.ajax({
				type: "POST",
				url: "https://stats.webscraper.io/post-stats",
				data: JSON.stringify({
					data: stats
				}),
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				success: function (response) {
					console.log(response);
					d.resolve();
				},
				failure: function (err) {
					console.log("failed to report stats " + err);
					d.reject(err);
				}
			});
		});

		return d.promise();
	}
};