/**
 * ContentScript that can be called from anywhere within the extension
 */
var ContentScript = {
	/**
	 * Fetch
	 * @param request.CSSSelector	CSS选择器的字符串
	 * @returns $.Deferred()
	 */
	getHTML: function(request) {
		var deferredHTML = $.Deferred();
		var html = $(request.CSSSelector).clone().wrap('<p>').parent().html();
		deferredHTML.resolve(html);
		return deferredHTML.promise();
	},

	/**
	 * 删除当前选择器内容
	 * @returns $.Deferred()
	 */
	removeCurrentContentSelector: function() {
		var deferredResponse = $.Deferred();
		var contentSelector = window.cs;
		if(contentSelector === undefined) {
			deferredResponse.resolve();
		} else {
			contentSelector.removeGUI();
			window.cs = undefined;
			deferredResponse.resolve();
		}
		return deferredResponse.promise();
	},

	/**
	 * 在iframe页面内选择元素
	 * @param request.parentCSSSelector
	 * @param request.allowedElements
	 */
	selectSelector: function(request) {
		// Deferred对象
		var deferredResponse = $.Deferred();
		// 初始化当前选择器
		this.removeCurrentContentSelector().done(function() {
			// ContentSelector选择器对象(使用iframe中对象)
			// var contentSelector = new ContentSelector({
			var contentSelector = new window.collect.ContentSelector({
				parentCSSSelector: request.parentCSSSelector,
				allowedElements: request.allowedElements,
				selectorType: request.selectorType
			});
			window.cs = contentSelector;
			// 初始化css选择器
			var deferredCSSSelector = contentSelector.getCSSSelector();
			// 当前选择
			deferredCSSSelector
			// 初始化当前选择器对象
			.done(function(response) {
				this.removeCurrentContentSelector().done(function(){
					deferredResponse.resolve(response);
					window.cs = undefined;
				}.bind(this));
			}.bind(this))
			// 失败方法
			.fail(function(message) {
				deferredResponse.reject(message);
				window.cs = undefined;
			}.bind(this));
		}.bind(this));

		return deferredResponse.promise();
	},

	/**
	 * 选择器-显示元素
	 * @param request.parentCSSSelector
	 * @param request.elementCSSSelector
	 */
	previewSelector: function(request) {
		var deferredResponse = $.Deferred();
		this.removeCurrentContentSelector().done(function () {
			// var contentSelector = new ContentSelector({
			var contentSelector = new window.collect.ContentSelector({
				parentCSSSelector: request.parentCSSSelector
			});
			window.cs = contentSelector;
			var deferredSelectorPreview = contentSelector.previewSelector(request.elementCSSSelector);
			deferredSelectorPreview.done(function() {
				deferredResponse.resolve();
			}).fail(function(message) {
				deferredResponse.reject(message);
				window.cs = undefined;
			});
		});
		return deferredResponse;
	}
};

var getContentScript = function(location) {
	var contentScript = {};
	// 处理不同地方的请求
	if(location === "ContentScript") {
		contentScript = ContentScript;
		return contentScript;
	} else if(location === "BackgroundScript" || location === "DevTools") {
		// 后台调用
		Object.keys(ContentScript).forEach(function(attr) {
			contentScript[attr] = ContentScript[attr];
		});
		return contentScript;
	} else {
		throw "Invalid ContentScript initialization - " + location;
	}
};