require("babel-core/polyfill");
var Reflux = require("reflux");
var debounce = require("debounce");
var { FancyWebSocket } = require("../utils/FancyWebSocket");
var API = require("../utils/ArachnadoAPI");


export var Actions = Reflux.createActions([
    "setAll",
    "updateStats",
    "startCrawl",
    "stopCrawl",
    "pauseCrawl",
    "resumeCrawl",
]);


export var store = Reflux.createStore({
    init: function () {
        this.jobs = [];
        this.listenToMany(Actions);
        this.triggerDebounced = debounce(this.trigger, 200);
    },

    getInitialState: function () {
        return this.jobs;
    },

    onSetAll: function (jobs) {
        this.jobs = jobs;
        this.triggerDebounced(jobs);
    },

    onUpdateStats: function (crawlId, changes) {
        this.jobs.filter(job => job.id == crawlId).forEach(job => {
            job.stats = Object.assign(job.stats || {}, changes);
        });
        this.trigger(this.jobs);
    },

    onStartCrawl: function (domain, options) {
        API.startCrawl(domain, options);
    },

    onStopCrawl: function (jobId) {
        API.stopCrawl(jobId);
    },

    onPauseCrawl: function (jobId) {
        API.pauseCrawl(jobId);
    },

    onResumeCrawl: function (jobId) {
        API.resumeCrawl(jobId);
    }
});


var socket = FancyWebSocket.instance();
socket.on("jobs:state", (jobs) => {
    //console.log("jobs:state", jobs);
    Actions.setAll(jobs);
});

socket.on("stats:changed", (data) => {
    var [crawlId, changes] = data;
    Actions.updateStats(crawlId, changes);
    //console.log("stats:changed", crawlId, changes);
});

Actions.setAll(window.INITIAL_DATA.jobs);

