/**
 * @param options.parentCSSSelector	Elements can be only selected within this element
 * @param options.allowedElements	Elements that can only be selected
 * @constructor
 */
ContentSelector = function(options) {
	// deferred返回对象
	this.deferredCSSSelectorResponse = $.Deferred();
	// 允许选择的元素
	this.allowedElements = options.allowedElements;
	// 父容器选择器
	this.parentCSSSelector = options.parentCSSSelector.trim();
	// 选择器类型
	this.selectorType = options.selectorType;
	// alert函数
	// this.alert = options.alert || function(txt) {alert(txt);};
	// 父选择器
	if(this.parentCSSSelector) {
		this.parent = $(this.parentCSSSelector)[0];
		// 父选择器未找到时的情况
		if(this.parent === undefined) {
			// this.deferredCSSSelectorResponse.reject("parent selector not found");
			// this.alert("Parent element not found!");
			// console.log("父元素未找到!");
			// return;
			this.parent = $("body")[0];
		}
	} else {
		this.parent = $("body")[0];
	}
};

ContentSelector.prototype = {
	/**
	 * 用户选择css选择器
	 */
	getCSSSelector: function() {
		if(this.deferredCSSSelectorResponse.state() !== "rejected") {
			// 用户选择的元素
			this.selectedElements = [];
			// 当前元素的父子元素层级(相对于当前元素)
			this.top = 0;
			// 初始化选择器
			this.initCssSelector(false);
			// 开启选择器
			this.initGUI();
		}
		return this.deferredCSSSelectorResponse.promise();
	},
	// 获取选择器
	getCurrentCSSSelector: function() {
		// 有效选择
		if(this.selectedElements && this.selectedElements.length > 0) {
			// 返回结果
			var cssSelector;
			// 选择集中包含父容器
			if(this.isParentSelected()) {
				// 只选中父容器
				if(this.selectedElements.length === 1) {
					cssSelector = '_parent_';
				// 启用多重选择时
				} else if($("#-selector-toolbar [name=diferentElementSelection]").prop("checked")) {
					var selectedElements = this.selectedElements.clone();
					// 删除父元素
					selectedElements.splice(selectedElements.indexOf(this.parent), 1);
					cssSelector = '_parent_, '+this.cssSelector.getCssSelector(selectedElements, this.top);
				} else {
					// 不允许多重选择时将报错
					cssSelector = this.cssSelector.getCssSelector(this.selectedElements, this.top);
				}
			// 选择集中不包含父元素
			} else {
				cssSelector = this.cssSelector.getCssSelector(this.selectedElements, this.top);
			}
			return cssSelector;
		}
		return "";
	},
	// 用户选择元素集合中包括父容器
	isParentSelected: function() {
		return this.selectedElements.indexOf(this.parent) !== -1;
	},

	/**
	 * 初始化或重新配置CSS选择器(允许多个选择器)
	 * @param allowMultipleSelectors
	 */
	initCssSelector: function(allowMultipleSelectors) {
		// CssSelector选择器类
		this.cssSelector = new CssSelector({
			enableSmartTableSelector: true,
			parent: this.parent,
			allowMultipleSelectors: allowMultipleSelectors,
			ignoredClasses: [
				"-sitemap-select-item-selected",
				"-sitemap-select-item-hover",
				"-sitemap-parent",
				"-web-scraper-img-on-top",
				"-web-scraper-selection-active"
			],
			query: jQuery
		});
	},

	previewSelector: function (elementCSSSelector) {
		if(this.deferredCSSSelectorResponse.state() !== "rejected") {

			this.highlightParent();
			$(ElementQuery(elementCSSSelector, this.parent)).addClass('-sitemap-select-item-selected');
			this.deferredCSSSelectorResponse.resolve();
		}

		return this.deferredCSSSelectorResponse.promise();
	},
	/*
	 * 开启选择器界面
	 */
	initGUI: function () {
		// 父元素为body 不要突出显示
		this.highlightParent();
		// 除工具栏外的所有元素
		this.$allElements = $(this.allowedElements+":not(#-selector-toolbar):not(#-selector-toolbar *)", this.parent);
		// 允许选择父节点(父元素不为body时)
		if (this.parent !== document.body){
			this.$allElements.push(this.parent);
		}
		// 鼠标指向、离开事件
		this.bindElementHighlight();
		// 元素点击事件
		this.bindElementSelection();
		// 键盘事件(选择当前元素父子级)
		this.bindKeyboardSelectionManipulations();
		// 选择器样式弹窗
		this.attachToolbar();
		// 是否启用多重选择
		this.bindMultipleGroupCheckbox();
		// 关闭错误提示
		this.bindMultipleGroupPopupHide();
		// 改变img位置
		this.bindMoveImagesToTop();
	},
	// 元素点击事件
	bindElementSelection: function (){
		this.$allElements.bind("click.elementSelector", function (e){
			var element = e.currentTarget;
			// 用户选择的元素集
			if (this.selectedElements.indexOf(element) === -1){
				this.selectedElements.push(element);
			}
			// 元素高光
			this.highlightSelectedElements();
			// 取消其他事件
			return false;
		}.bind(this));
	},

	/**
	 * Add to select elements the element that is under the mouse
	 */
	selectMouseOverElement: function() {
		var element = this.mouseOverElement;
		if(element) {
			this.selectedElements.push(element);
			this.highlightSelectedElements();
		}
	},
	// 鼠标指向、离开事件
	bindElementHighlight: function () {
		$(this.$allElements)
		// 鼠标指向
		.bind("mouseover.elementSelector", function (e){
			// 除了web scraper对于其他的事件监听冒泡
			if(e.target !== e.currentTarget) {
				return;
			}
			var element = e.currentTarget;
			this.mouseOverElement = element;
			$(element).addClass("-sitemap-select-item-hover");
		}.bind(this))
		// 鼠标离开
		.bind("mouseout.elementSelector", function (e){
			// 除了web scraper对于其他的事件监听冒泡
			if(e.target !== e.currentTarget) {
				return;
			}
			var element = e.currentTarget;
			this.mouseOverElement = null;
			$(element).removeClass("-sitemap-select-item-hover");
		}.bind(this));
	},
	// 改变img位置
	bindMoveImagesToTop: function() {
		$("body").addClass("-web-scraper-selection-active");
		// 选择img标签时 改变img位置
		if(this.allowedElements === 'img') {
			$("img").filter(function(i, element) {
				return $(element).css("position") === 'static';
			}).addClass("-web-scraper-img-on-top");
		}
	},

	unbindMoveImagesToTop: function() {

		$("body.-web-scraper-selection-active").removeClass("-web-scraper-selection-active");
		$("img.-web-scraper-img-on-top").removeClass("-web-scraper-img-on-top");
	},

	selectChild: function () {
		this.top--;
		if (this.top < 0) {
			this.top = 0;
		}
	},
	selectParent: function () {
		this.top++;
	},

	// 键盘事件
	bindKeyboardSelectionManipulations: function () {
		// check for focus
		var lastFocusStatus;
		this.keyPressFocusInterval = setInterval(function() {
			var focus = document.hasFocus();
			if(focus === lastFocusStatus) {
				return;
            }
			lastFocusStatus = focus;
			$("#-selector-toolbar .key-button").toggleClass("hide", !focus);
			$("#-selector-toolbar .key-events").toggleClass("hide", focus);
		}.bind(this), 200);
		// 改变当前选择的层级(+/-1)
		// 选择元素
		$(document).bind("keydown.selectionManipulation", function (event) {
			// 使用C键选择子元素
			if (event.keyCode === 67) {
				this.animateClickedKey($("#-selector-toolbar .key-button-child"));
				this.selectChild();
			}
			// 使用P键选择父元素
			else if (event.keyCode === 80) {
				this.animateClickedKey($("#-selector-toolbar .key-button-parent"));
				this.selectParent();
			}
			// 使用S键选择该元素
			else if (event.keyCode === 83) {
				this.animateClickedKey($("#-selector-toolbar .key-button-select"));
				this.selectMouseOverElement();
			}
			// 高光标识
			this.highlightSelectedElements();
		}.bind(this));
	},

	animateClickedKey: function(element) {
		$(element).removeClass("clicked").removeClass("clicked-animation");
		setTimeout(function() {
			$(element).addClass("clicked");
			setTimeout(function(){
				$(element).addClass("clicked-animation");
			},100);
		},1);

	},

	highlightSelectedElements: function () {
		try {
			var resultCssSelector = this.getCurrentCSSSelector();
			$("body #-selector-toolbar .selector").text(resultCssSelector);
			// highlight selected elements
			$(".-sitemap-select-item-selected").removeClass('-sitemap-select-item-selected');
			$(ElementQuery(resultCssSelector, this.parent)).addClass('-sitemap-select-item-selected');
		}
		catch(err) {
			if(err === "found multiple element groups, but allowMultipleSelectors disabled") {
				// console.log("禁用多个不同的元素选择");
				this.showMultipleGroupPopup();
				// remove last added element
				this.selectedElements.pop();
				this.highlightSelectedElements();
			}
		}
	},

	showMultipleGroupPopup: function() {
		$("#-selector-toolbar .popover").attr("style", "display:block !important;");
	},
	// 关闭错误提示
	hideMultipleGroupPopup: function() {
		$("#-selector-toolbar .popover").attr("style", "");
	},
	// 关闭错误提示事件
	bindMultipleGroupPopupHide: function() {
		$("#-selector-toolbar .popover .close").click(this.hideMultipleGroupPopup.bind(this));
	},

	unbindMultipleGroupPopupHide: function() {
		$("#-selector-toolbar .popover .close").unbind("click");
	},
	// 是否启用多重选择
	bindMultipleGroupCheckbox: function() {
		$("#-selector-toolbar [name=diferentElementSelection]").change(function(e) {
			if($(e.currentTarget).is(":checked")) {
				this.initCssSelector(true);
			}
			else {
				this.initCssSelector(false);
			}
		}.bind(this));
	},
	unbindMultipleGroupCheckbox: function(){
		$("#-selector-toolbar .diferentElementSelection").unbind("change");
	},
	// 选择器样式
	attachToolbar: function () {
		var toolbar = `<div id="-selector-toolbar">
			<div class="list-item">
				<div class="selector-container">
					<div class="selector"></div>
				</div>
			</div>
			<div class="input-group-addon list-item">
				<input type="checkbox" title="启用多重元素选择器" name="diferentElementSelection">
				<div class="popover top">
					<div class="close">×</div>
					<div class="arrow"></div>
					<div class="popover-content">
						<div class="txt">选择元素非同列表元素，如果本次点击包括您选择的元素，请确定选择后再次重试。</div>
					</div>
				</div>
			</div>
			<div class="list-item key-events">
				<div title="单击此处可启用键盘事件进行选择元素层级">开启键盘事件</div></div>
			<div class="list-item key-button key-button-select hide" title="使用S键选择当前元素">S</div>
			<div class="list-item key-button key-button-parent hide" title="使用P键选择当前元素父元素">P</div>
			<div class="list-item key-button key-button-child hide" title="使用C键选择当前元素子元素">C</div>
			<div class="list-item done-selecting-button">确定</div>
		</div>`;
		$("body").append(toolbar);
		// 确定选择元素时
		$("body #-selector-toolbar .done-selecting-button").click(function () {
			// 显示选择结果
			this.selectionFinished();
		}.bind(this));
	},
	// 父元素为body 不要突出显示
	highlightParent: function () {
		// 父元素为body 不要突出显示
		if(!$(this.parent).is("body") && !$(this.parent).is("#webpage")) {
			$(this.parent).addClass("-sitemap-parent");
		}
		// 详情点击 显示
		if(this.selectorType === 'SelectorDetail'){
			$(this.parent).addClass("-sitemap-parent");
		}
	},

	unbindElementSelection: function () {
		$(this.$allElements).unbind("click.elementSelector");
		// remove highlighted element classes
		this.unbindElementSelectionHighlight();
	},
	unbindElementSelectionHighlight: function () {
		$(".-sitemap-select-item-selected").removeClass('-sitemap-select-item-selected');
		$(".-sitemap-parent").removeClass('-sitemap-parent');
	},
	unbindElementHighlight: function () {
		$(this.$allElements).unbind("mouseover.elementSelector")
			.unbind("mouseout.elementSelector");
	},
	unbindKeyboardSelectionMaipulatios: function () {
		$(document).unbind("keydown.selectionManipulation");
		clearInterval(this.keyPressFocusInterval);
	},
	removeToolbar: function () {
		$("body #-selector-toolbar a").unbind("click");
		$("#-selector-toolbar").remove();
	},

	/**
	 * Remove toolbar and unbind events
	 */
	removeGUI: function() {

		this.unbindElementSelection();
		this.unbindElementHighlight();
		this.unbindKeyboardSelectionMaipulatios();
		this.unbindMultipleGroupPopupHide();
		this.unbindMultipleGroupCheckbox();
		this.unbindMoveImagesToTop();
		this.removeToolbar();
	},
	// 返回选择器结果
	selectionFinished: function () {
		var resultCssSelector = this.getCurrentCSSSelector();
		this.deferredCSSSelectorResponse.resolve({
			CSSSelector: resultCssSelector
		});
	}
};
