/* sitemap控制器  面板主程序 */
var SitemapController = function (options) {

    for (var i in options) {
        this[i] = options[i];
    }
    this.init();
};

SitemapController.prototype = {
    contentScript: getContentScript("DevTools"),
    // 注册事件
    control: function (controls) {
        var controller = this;

        for (var selector in controls) {
            for (var event in controls[selector]) {
                $(document).on(event, selector, (function (selector, event) {
                    return function () {
                        var continueBubbling = controls[selector][event].call(controller, this);
                        if (continueBubbling !== true) {
                            return false;
                        }
                    };
                })(selector, event));
            }
        }
    },
    // 加载模板
    loadTemplates: function (cbAllTemplatesLoaded) {
        var templateIds = [
            'Viewport',
            'SitemapList',
            'SitemapListItem',
            'SitemapCreate',
            'SitemapStartUrlField',
            'SitemapImport',
            'SitemapSave',
            'SitemapBrowseData',
            'SitemapScrapeConfig',
            'SitemapExportDataCSV',
            'SitemapEditMetadata',
            'SelectorList',
            'SelectorListItem',
            'SelectorEdit',
            'SelectorEditTableColumn',
            'SitemapSelectorGraph',
            'DataPreview'
        ];
        var templatesLoaded = 0;
        // ich加载模板
        var cbLoaded = function (templateId, template) {
            templatesLoaded++;
            ich.addTemplate(templateId, template);
            if (templatesLoaded === templateIds.length) {
                cbAllTemplatesLoaded();
            }
        };

        templateIds.forEach(function (templateId) {
            $.get('/static/' + this.templateDir + templateId + '.html', cbLoaded.bind(this, templateId));
        }.bind(this));
    },

    // 初始化
    init: function () {
        this.loadTemplates(function () {
            // 初始化全局对象state
            this.clearState();
            // 渲染模板
            var initSitemap = ich.Viewport();
            $(".sidebar").append(initSitemap);
            // 禁止form submit
            $("form").bind("submit", function () {
                return false;
            });
            // 注册事件
            this.control({
                // 保存选择器
                '#sitemap-export-nav-button': {
                    click: this.showSitemapExportPanel
                },
                // 保存按钮
                '#viewport button[action=sitemap-save-button]': {
                    click: this.saveConfig
                },
                '#sitemap-export-data-csv-nav-button': {
                    click: this.showSitemapExportDataCsvPanel
                },
                '#submit-create-sitemap': {
                    click: this.createSitemap
                },
                '#submit-import-sitemap': {
                    click: this.importSitemap
                },
                '#sitemap-edit-metadata-nav-button': {
                    click: this.editSitemapMetadata
                },
                '#sitemap-selector-list-nav-button': {
                    click: this.showSitemapSelectorList
                },
                '#sitemap-selector-graph-nav-button': {
                    click: this.showSitemapSelectorGraph
                },
                '#sitemap-browse-nav-button': {
                    click: this.browseSitemapData
                },
                'button#submit-edit-sitemap': {
                    click: this.editSitemapMetadataSave
                },
                '#edit-sitemap-metadata-form': {
                    submit: function(){return false;}
                },
                '#sitemaps tr': {
                    click: this.editSitemap
                },
                '#sitemaps button[action=delete-sitemap]': {
                    click: this.deleteSitemap
                },
                '#sitemap-scrape-nav-button': {
                    click: this.showScrapeSitemapConfigPanel
                },
                '#submit-scrape-sitemap-form': {
                    submit: function(){return false;}
                },
                // 开始任务
                '#submit-scrape-sitemap': {
                    click: this.scrapeSitemap
                },
                "#sitemaps button[action=browse-sitemap-data]": {
                    click: this.sitemapListBrowseSitemapData
                },
                '#sitemaps button[action=csv-download-sitemap-data]': {
                    click: this.downloadSitemapData
                },
                // @TODO move to tr
                '#selector-tree tbody tr': {
                    click: this.showChildSelectors
                },
                '#selector-tree .breadcrumb a': {
                    click: this.treeNavigationshowSitemapSelectorList
                },
                '#selector-tree tr button[action=edit-selector]': {
                    click: this.editSelector
                },
                '#edit-selector select[name=type]': {
                    change: this.selectorTypeChanged
                },
                // 保存新增选择器
                '#edit-selector button[action=save-selector]': {
                    click: this.saveSelector
                },
                '#edit-selector button[action=cancel-selector-editing]': {
                    click: this.cancelSelectorEditing
                },
                '#edit-selector #selectorId': {
                    keyup: this.updateSelectorParentListOnIdChange
                },
                '#selector-tree button[action=add-selector]': {
                    click: this.addSelector
                },
                "#selector-tree tr button[action=delete-selector]": {
                    click: this.deleteSelector
                },
                "#selector-tree tr button[action=preview-selector]": {
                    click: this.previewSelectorFromSelectorTree
                },
                "#selector-tree tr button[action=data-preview-selector]": {
                    click: this.previewSelectorDataFromSelectorTree
                },
                "#edit-selector button[action=select-selector]": {
                    click: this.selectSelector
                },
                "#edit-selector button[action=select-table-header-row-selector]": {
                    click: this.selectTableHeaderRowSelector
                },
                "#edit-selector button[action=select-table-data-row-selector]": {
                    click: this.selectTableDataRowSelector
                },
                "#edit-selector button[action=preview-selector]": {
                    click: this.previewSelector
                },
                "#edit-selector button[action=preview-click-element-selector]": {
                    click: this.previewClickElementSelector
                },
                "#edit-selector button[action=preview-table-row-selector]": {
                    click: this.previewTableRowSelector
                },
                "#edit-selector button[action=preview-selector-data]": {
                    click: this.previewSelectorDataFromSelectorEditing
                },
                "button.add-extra-start-url": {
                    click: this.addStartUrl
                },
                "button.remove-start-url": {
                    click: this.removeStartUrl
                }
            });
            this.showSitemaps();
            this.createSitemap();
        }.bind(this));
        // 改变样式

        // // web scraper was used today
        // this.backgroundScript.setDailyStat({
        //     key: "webScraperOpened",
        //     value: true
        // });
        //
        // // start web scraper usage counter
        // this.backgroundScript.updateExtensionIsBeingUsed();
        // setInterval(function() {
        //     this.backgroundScript.updateExtensionIsBeingUsed();
        // }.bind(this),60e3);
    },
    // 清除对象
    clearState: function () {
        // 全局对象
        this.state = {
            // sitemap对象
            currentSitemap: null,
            // 面包屑导航id值
            editSitemapBreadcumbsSelectors: null,
            // 面包屑导航根id:_root
            currentParentSelectorId: null,
            // 当前选择器id值
            currentSelector: null
        };
    },
    // state对象初始化设置
    setStateEditSitemap: function (sitemap) {
        this.state.currentSitemap = sitemap;
        this.state.editSitemapBreadcumbsSelectors = [
            {id: '_root'}
        ];
        this.state.currentParentSelectorId = '_root';
    },
    // 设置导航栏样式
    setActiveNavigationButton: function (navigationId) {
        $(".nav .active").removeClass("active");
        $("#" + navigationId + "-nav-button").closest("li").addClass("active");
        if (navigationId.match(/^sitemap-/)) {
            $("#sitemap-nav-button").removeClass("disabled");
            $("#sitemap-nav-button").closest("li").addClass('active');
            $("#navbar-active-sitemap-id").text("(" + this.state.currentSitemap._id + ")");
        } else {
            $("#sitemap-nav-button").addClass("disabled");
            $("#navbar-active-sitemap-id").text("");
        }
        if (navigationId.match(/^create-sitemap-/)) {
            $("#create-sitemap-nav-button").closest("li").addClass('active');
        }
    },
    /**
     * Simple info popup for sitemap start url input field
     */

    /**
     * Simple info popup for sitemap start url input field
     */
    initMultipleStartUrlHelper: function () {
        $("#startUrl")
            .popover({
                title: 'Multiple start urls',
                html: true,
                content: "You can create ranged start urls like this:<br />http://example.com/[1-100].html",
                placement: 'bottom'
            })
            .blur(function () {
                $(this).popover('hide');
            });
    },

    /**
     * 返回当前视图中bootstrapValidator对象
     */
    getFormValidator: function() {
        var validator = $('#viewport form').data('bootstrapValidator');
        return validator;
    },

    /**
     * Returns whether current form in the viewport is valid
     * @returns {Boolean}
     */
    isValidForm: function() {
        var validator = this.getFormValidator();

        //validator.validate();
        // validate method calls submit which is not needed in this case.
        for (var field in validator.options.fields) {
            validator.validateField(field);
        }

        var valid = validator.isValid();
        return valid;
    },

    /**
     * Add validation to sitemap creation or editing form
     */
    initSitemapValidation: function() {

        $('#viewport form').bootstrapValidator({
            fields: {
                "_id": {
                    validators: {
                        notEmpty: {
                            message: 'The sitemap id is required and cannot be empty'
                        },
                        stringLength: {
                            min: 3,
                            message: 'The sitemap id should be atleast 3 characters long'
                        },
                        regexp: {
                            regexp: /^[a-z][a-z0-9_\$\(\)\+\-/]+$/,
                            message: 'Only lowercase characters (a-z), digits (0-9), or any of the characters _, $, (, ), +, -, and / are allowed. Must begin with a letter.'
                        },
                        // placeholder for sitemap id existance validation
                        callback: {
                            message: 'Sitemap with this id already exists',
                            callback: function(value, validator) {
                                return true;
                            }.bind(this)
                        }
                    }
                },
                "startUrl[]": {
                    validators: {
                        notEmpty: {
                            message: 'The start URL is required and cannot be empty'
                        },
                        uri: {
                            message: 'The start URL is not a valid URL'
                        }
                    }
                }
            }
        });
    },

    showCreateSitemap: function () {
        this.setActiveNavigationButton('create-sitemap-create');
        var sitemapForm = ich.SitemapCreate();
        $("#viewport").html(sitemapForm);
        this.initMultipleStartUrlHelper();
        this.initSitemapValidation();

        return true;
    },

    initImportStiemapValidation: function(){
        $('#viewport form').bootstrapValidator({
            fields: {
                "_id": {
                    validators: {
                        stringLength: {
                            min: 3,
                            message: 'The sitemap id should be atleast 3 characters long'
                        },
                        regexp: {
                            regexp: /^[a-z][a-z0-9_\$\(\)\+\-/]+$/,
                            message: 'Only lowercase characters (a-z), digits (0-9), or any of the characters _, $, (, ), +, -, and / are allowed. Must begin with a letter.'
                        },
                        // placeholder for sitemap id existance validation
                        callback: {
                            message: 'Sitemap with this id already exists',
                            callback: function(value, validator) {
                                return true;
                            }.bind(this)
                        }
                    }
                },
                sitemapJSON: {
                    validators: {
                        notEmpty: {
                            message: 'Sitemap JSON is required and cannot be empty'
                        },
                        callback: {
                            message: 'JSON is not valid',
                            callback: function(value, validator) {
                                try {
                                    JSON.parse(value);
                                } catch (e) {
                                    return false;
                                }
                                return true;
                            }.bind(this)
                        }
                    }
                }
            }
        });
    },
    // 导入数据
    showImportSitemapPanel: function () {
        this.setActiveNavigationButton('create-sitemap-import');
        var sitemapForm = ich.SitemapImport();
        $("#viewport").html(sitemapForm);
        this.initImportStiemapValidation();
        return true;
    },
    // 保存数据
    showSitemapExportPanel: function () {
        this.setActiveNavigationButton('sitemap-export');
        // 获取sitemap JSON数据
        var sitemap = this.state.currentSitemap;
        var sitemapConfig = JSON.stringify(window.CONFIG_DATA);
        var sitemapJSON = sitemap.exportSitemap();
        var sitemapSaveForm = ich.SitemapSave({
            sitemapJSON: sitemapJSON,
            sitemapConfig: sitemapConfig
        });
        // 表单验证
        $("#viewport").html(sitemapSaveForm);
        this.initScrapeSitemapSaveValidation();
        return true;
    },
    showSitemaps: function () {

        this.clearState();
        this.setActiveNavigationButton("sitemaps");

        // this.store.getAllSitemaps(function (sitemaps) {
        //     $sitemapListPanel = ich.SitemapList();
        //     sitemaps.forEach(function (sitemap) {
        //         $sitemap = ich.SitemapListItem(sitemap);
        //         $sitemap.data("sitemap", sitemap);
        //         $sitemapListPanel.find("tbody").append($sitemap);
        //     });
        //     $("#viewport").html($sitemapListPanel);
        // });
        $sitemapListPanel = ich.SitemapList();
        $("#viewport").html($sitemapListPanel);
    },

    getSitemapFromMetadataForm: function(){

        var id = $("#viewport form input[name=_id]").val();
        var $startUrlInputs = $("#viewport form .input-start-url");
        var startUrl;
        if($startUrlInputs.length === 1) {
            startUrl = $startUrlInputs.val();
        } else {
            startUrl = [];
            $startUrlInputs.each(function(i, element) {
                startUrl.push($(element).val());
            });
        }

        return {
            id:id,
            startUrl:startUrl
        };
    },

    createSitemap: function () {
        // cancel submit if invalid form
        if (window.CONFIG_DATA){
            var sitemapData = {id: window.CONFIG_DATA.name, startUrl: window.CONFIG_DATA.url};
        } else{
            var sitemapData = {id: "zhihu", startUrl: "http://www.acfun.cn/"};
        }
        // var sitemapData = {id: "zhihu", startUrl: "http://www.acfun.cn/"};
        // check whether sitemap with this id already exist
        // this.backgroundScript.incrementDailyStat({
        //     key: "sitemapsCreated",
        //     increment: 1
        // });
        var sitemap = new Sitemap({
            _id: sitemapData.id,
            startUrl: sitemapData.startUrl,
            selectors: []
        });
        this._editSitemap(sitemap, ['_root']);
    },

    importSitemap: function () {

        // cancel submit if invalid form
        if(!this.isValidForm()) {
            return false;
        }

        // load data from form
        var sitemapJSON = $("[name=sitemapJSON]").val();
        var id = $("input[name=_id]").val();
        var sitemap = new Sitemap();
        sitemap.importSitemap(sitemapJSON);
        if(id.length) {
            sitemap._id = id;
        }
        // check whether sitemap with this id already exist
        this.store.sitemapExists(sitemap._id, function (sitemapExists) {
            if(sitemapExists) {
                var validator = this.getFormValidator();
                validator.updateStatus('_id', 'INVALID', 'callback');
            } else {
                // stats
                // this.backgroundScript.incrementDailyStat({
                //     key: "sitemapsImported",
                //     increment: 1
                // });

                this.store.createSitemap(sitemap, function (sitemap) {
                    this._editSitemap(sitemap, ['_root']);
                }.bind(this, sitemap));
            }
        }.bind(this));
    },

    editSitemapMetadata: function (button) {

        this.setActiveNavigationButton('sitemap-edit-metadata');

        var sitemap = this.state.currentSitemap;
        var $sitemapMetadataForm = ich.SitemapEditMetadata(sitemap);
        $("#viewport").html($sitemapMetadataForm);
        this.initMultipleStartUrlHelper();
        this.initSitemapValidation();

        return true;
    },

    editSitemapMetadataSave: function (button) {
        var sitemap = this.state.currentSitemap;
        var sitemapData = this.getSitemapFromMetadataForm();

        // cancel submit if invalid form
        if(!this.isValidForm()) {
            return false;
        }

        // check whether sitemap with this id already exist
        this.store.sitemapExists(sitemapData.id, function (sitemapExists) {
            if(sitemap._id !== sitemapData.id && sitemapExists) {
                var validator = this.getFormValidator();
                validator.updateStatus('_id', 'INVALID', 'callback');
                return;
            }

            // change data
            sitemap.startUrl = sitemapData.startUrl;

            // just change sitemaps url
            if (sitemapData.id === sitemap._id) {
                // this.store.saveSitemap(sitemap, function (sitemap) {
                //     this.showSitemapSelectorList();
                // }.bind(this));
                this.showSitemapSelectorList();
            // id changed. we need to delete the old one and create a new one
            } else {
                var newSitemap = new Sitemap(sitemap);
                var oldSitemap = sitemap;
                newSitemap._id = sitemapData.id;
                this.store.createSitemap(newSitemap, function (newSitemap) {
                    this.store.deleteSitemap(oldSitemap, function () {
                        this.state.currentSitemap = newSitemap;
                        this.showSitemapSelectorList();
                    }.bind(this));
                }.bind(this));
            }

        }.bind(this));
    },

    /**
     * Callback when sitemap edit button is clicked in sitemap grid
     */
    editSitemap: function (tr) {

        var sitemap = $(tr).data("sitemap");
        this._editSitemap(sitemap);
    },

    _editSitemap: function (sitemap) {
        this.setStateEditSitemap(sitemap);
        this.setActiveNavigationButton("sitemap");
        this.showSitemapSelectorList();
    },
    // 展现选择器列表
    showSitemapSelectorList: function () {
        // 更新样式
        this.setActiveNavigationButton('sitemap-selector-list');

        var sitemap = this.state.currentSitemap;
        var parentSelectors = this.state.editSitemapBreadcumbsSelectors;
        var parentSelectorId = this.state.currentParentSelectorId;

        var $selectorListPanel = ich.SelectorList({
            parentSelectors: parentSelectors
        });
        // 该父容器下的选择器
        var selectors = sitemap.getDirectChildSelectors(parentSelectorId);
        selectors.forEach(function (selector) {
            $selector = ich.SelectorListItem(selector);
            $selector.data("selector", selector);
            $selectorListPanel.find("tbody").append($selector);
        });
        $("#viewport").html($selectorListPanel);

        return true;
    },
    showSitemapSelectorGraph: function () {
        this.setActiveNavigationButton('sitemap-selector-graph');
        var sitemap = this.state.currentSitemap;
        var $selectorGraphPanel = ich.SitemapSelectorGraph();
        $("#viewport").html($selectorGraphPanel);
        var graphDiv = $("#selector-graph")[0];
        var graph = new SelectorGraphv2(sitemap);
        graph.draw(graphDiv, $(document).width(), 200);
        return true;
    },
    showChildSelectors: function (tr) {
        var selector = $(tr).data('selector');
        var parentSelectors = this.state.editSitemapBreadcumbsSelectors;
        this.state.currentParentSelectorId = selector.id;
        parentSelectors.push(selector);

        this.showSitemapSelectorList();
    },

    treeNavigationshowSitemapSelectorList: function (button) {
        var parentSelectors = this.state.editSitemapBreadcumbsSelectors;
        var controller = this;
        $("#selector-tree .breadcrumb li a").each(function (i, parentSelectorButton) {
            if (parentSelectorButton === button) {
                parentSelectors.splice(i + 1);
                controller.state.currentParentSelectorId = parentSelectors[i].id;
            }
        });
        this.showSitemapSelectorList();
    },
    // 表单验证
    initSelectorValidation: function() {
        // 验证表单
        var Validation = {
            fields: {
                "id": {
                    validators: {
                        notEmpty: {
                            message: '字段名称不能为空'
                        },
                        regexp: {
                            regexp: /^[^_].*$/,
                            message: '字段名称不能以下划线(_)开始'
                        }
                    }
                },
                selector: {
                    validators: {
                        notEmpty: {
                            message: '选择器不能为空'
                        }
                    }
                },
                pageUrl: {
                    validators: {
                        uri: {
                            message: '请输入正确的url, 需翻页的参数写在最后'
                        }
                    }
                },
                startNum: {
                    validators: {
                        numeric: {
                            message: '请输入数字'
                        }
                    }
                },
                endNum: {
                    validators: {
                        numeric: {
                            message: '请输入数字'
                        },
                        callback: {
                            message: '终止页数必须大于起始页',
                            callback: function(value, validator){
                                var startNum = parseInt($("#edit-selector [name=startNum]").val());
                                if (startNum > value){
                                    return false;
                                } else {
                                    return true;
                                }
                            }
                        }
                    }
                },
                regex: {
                    validators: {
                        callback: {
                            message: '匹配内容为空 不支持',
                            callback: function(value, validator) {
                                // allow no regex
                                if(!value) {
                                    return true;
                                }

                                var matches = "".match(new RegExp(value));
                                if(matches !== null && matches[0] === "") {
                                    return false;
                                } else {
                                    return true;
                                }
                            }
                        }
                    }
                },
                clickElementSelector: {
                    validators: {
                        notEmpty: {
                            message: '点击元素不能为空'
                        }
                    }
                },
                tableHeaderRowSelector: {
                    validators: {
                        notEmpty: {
                            message: '标题行选择器不能为空'
                        }
                    }
                },
                tableDataRowSelector: {
                    validators: {
                        notEmpty: {
                            message: 'D内容行选择器不能为空'
                        }
                    }
                },
                delay: {
                    validators: {
                        numeric: {
                            message: '间隔时间必须为数字'
                        }
                    }
                },
                parentSelectors: {
                    validators: {
                        notEmpty: {
                            message: '必须选择至少一个父选择器'
                        },
                        callback: {
                            message: '无法处理递归元素选择器',
                            callback: function(value, validator, $field) {

                                var sitemap = this.getCurrentlyEditedSelectorSitemap();
                                return !sitemap.selectors.hasRecursiveElementSelectors();

                            }.bind(this)
                        }
                    }
                }
            }
        };
        // bootstrapValidator插件
        $('#viewport form').bootstrapValidator(Validation);
    },
    editSelector: function (button) {
        var selector = $(button).closest("tr").data('selector');
        this._editSelector(selector);
    },
    updateSelectorParentListOnIdChange: function() {

        var selector = this.getCurrentlyEditedSelector();
        $(".currently-edited").val(selector.id).text(selector.id);
    },
    // 修改选择器页面
    _editSelector: function (selector) {
        var sitemap = this.state.currentSitemap;
        var selectorIds = sitemap.getPossibleParentSelectorIds();

        var $editSelectorForm = ich.SelectorEdit({
            selector: selector,
            selectorIds: selectorIds,
            // 字段类型加载
            selectorTypes: [
                {
                    type: 'SelectorText',
                    title: '文本选择器'
                },
                {
                    type: 'SelectorLink',
                    title: '翻页选择器'
                },
                {
                    type: 'SelectorDetail',
                    title: '详情页选择器'
                },
                {
                    type: 'SelectorHTML',
                    title: 'html选择器'
                },
                {
                    type: 'SelectorElement',
                    title: '元素集选择器'
                },
                {
                    type: 'SelectorImage',
                    title: '图片选择器'
                },
                {
                    type: 'SelectorElementAttribute',
                    title: '元素属性选择器'
                }
            ]
        });
        $("#viewport").html($editSelectorForm);
        // 父容器加载
        $("#edit-selector #parentSelectors option").each(function(i, element) {
            if($(element).val() === selector.id) {
                $(element).addClass("currently-edited");
            }
        });

        // 设置click点击类型表单
        if(selector.clickType) {
            $editSelectorForm.find("[name=clickType]").val(selector.clickType);
        }
        // 设置click点击元素表单
        if(selector.clickElementUniquenessType) {
            $editSelectorForm.find("[name=clickElementUniquenessType]").val(selector.clickElementUniquenessType);
        }
        // 字段类型
        $editSelectorForm.find("[name=type]").val(selector.type);
        // 父选择器
        selector.parentSelectors.forEach(function (parentSelectorId) {
            $editSelectorForm.find("#parentSelectors [value='" + parentSelectorId + "']").attr("selected", "selected");
        });

        this.state.currentSelector = selector;
        // 字段类型事件
        this.selectorTypeChanged();
        // 表单验证
        this.initSelectorValidation();
    },
    // 字段类型事件
    selectorTypeChanged: function () {
        var type = $("#edit-selector select[name=type]").val();
        var features = window[type].getFeatures();
        $("#edit-selector .feature").hide();
        features.forEach(function (feature) {
            $("#edit-selector .feature-" + feature).show();
        });
        // add this selector to possible parent selector
        var selector = this.getCurrentlyEditedSelector();
        if(selector.canHaveChildSelectors()) {
            if($("#edit-selector #parentSelectors .currently-edited").length === 0) {
                var $option = $('<option class="currently-edited"></option>');
                $option.text(selector.id).val(selector.id);
                $("#edit-selector #parentSelectors").append($option);
            }
        // remove if type doesn't allow to have child selectors
        } else {
            $("#edit-selector #parentSelectors .currently-edited").remove();
        }
    },
    // 保存新增选择器
    saveSelector: function (button) {
        var sitemap = this.state.currentSitemap;
        var selector = this.state.currentSelector;
        var newSelector = this.getCurrentlyEditedSelector();
        // 表单验证
        if(!this.isValidForm()) {
            return false;
        }
        // // 验证翻页选择器在入口页面且唯一
        // if (newSelector.type === "SelectorLink"){
        //     var linkValid = sitemap.selectors.getDirectChildSelectors(newSelector.parentSelectors[0]).filter(i => i.type === "SelectorLink" && i.id !== newSelector.id);
        //     if (JSON.stringify(linkValid) !== '[]'){
        //         this.showSitemapSelectorList();
        //         return;
        //     }
        // }
        // // 验证详情选择器唯一
        // if (newSelector.type === "SelectorDetail"){
        //     var detailValid = sitemap.selectors.getDirectChildSelectors(newSelector.parentSelectors[0]).filter(i => i.type === "SelectorDetail" && i.id !== newSelector.id);
        //     if (JSON.stringify(detailValid) !== '[]'){
        //         this.showSitemapSelectorList();
        //         return;
        //     }
        // }
        // // 验证元素集选择器唯一
        // if (newSelector.type === "SelectorElement"){
        //     var elementValid = sitemap.selectors.getDirectChildSelectors(newSelector.parentSelectors[0]).filter(i => i.type === "SelectorElement" && i.id !== newSelector.id);
        //     if (JSON.stringify(elementValid) !== '[]'){
        //         this.showSitemapSelectorList();
        //         return;
        //     }
        // }
        // 更新selector对象
        sitemap.updateSelector(selector, newSelector);
        // 前台展现
        this.showSitemapSelectorList();
    },
    // 获取表单数据 生成新Selector对象
    getCurrentlyEditedSelector: function () {
        var id = $("#edit-selector [name=id]").val();
        var selectorsSelector = $("#edit-selector [name=selector]").val();
        var tableDataRowSelector = $("#edit-selector [name=tableDataRowSelector]").val();
        var tableHeaderRowSelector = $("#edit-selector [name=tableHeaderRowSelector]").val();
        var clickElementSelector = $("#edit-selector [name=clickElementSelector]").val();
        var type = $("#edit-selector [name=type]").val();
        var clickElementUniquenessType = $("#edit-selector [name=clickElementUniquenessType]").val();
        var clickType = $("#edit-selector [name=clickType]").val();
        var discardInitialElements = $("#edit-selector [name=discardInitialElements]").is(":checked");
        var multiple = $("#edit-selector [name=multiple]").is(":checked");
        var downloadImage = $("#edit-selector [name=downloadImage]").is(":checked");
        var clickPopup = $("#edit-selector [name=clickPopup]").is(":checked");
        var pageUrl = $("#edit-selector [name=pageUrl]").val();
        var startNum = !$("#edit-selector [name=startNum]").val() ? 0 : parseInt($("#edit-selector [name=startNum]").val());
        var endNum = !$("#edit-selector [name=endNum]").val() ? 0 : parseInt($("#edit-selector [name=endNum]").val());
        var regex = $("#edit-selector [name=regex]").val();
        var delay = $("#edit-selector [name=delay]").val();
        var extractAttribute = $("#edit-selector [name=extractAttribute]").val();
        var parentSelectors = $("#edit-selector [name=parentSelectors]").val();
        var columns = [];
        var $columnHeaders = $("#edit-selector .column-header");
        var $columnNames = $("#edit-selector .column-name");
        var $columnExtracts = $("#edit-selector .column-extract");

        $columnHeaders.each(function(i){
            var header = $($columnHeaders[i]).val();
            var name = $($columnNames[i]).val();
            var extract = $($columnExtracts[i]).is(":checked");
            columns.push({
                header:header,
                name:name,
                extract:extract
            });
        });

        var newSelector = new Selector({
            id: id,
            selector: selectorsSelector,
            tableHeaderRowSelector: tableHeaderRowSelector,
            tableDataRowSelector: tableDataRowSelector,
            clickElementSelector: clickElementSelector,
            clickElementUniquenessType: clickElementUniquenessType,
            clickType: clickType,
            discardInitialElements: discardInitialElements,
            type: type,
            multiple: multiple,
            downloadImage: downloadImage,
            clickPopup: clickPopup,
            pageUrl: pageUrl,
            startNum: startNum,
            endNum: endNum,
            regex: regex,
            extractAttribute:extractAttribute,
            parentSelectors: parentSelectors,
            columns:columns,
            delay:delay
        });
        return newSelector;
    },
    /**
     * @returns {Sitemap|*} 拷贝Sitemap返回当前selector
     */
    getCurrentlyEditedSelectorSitemap: function () {
        var sitemap = this.state.currentSitemap.clone();
        var selector = sitemap.getSelectorById(this.state.currentSelector.id);
        var newSelector = this.getCurrentlyEditedSelector();
        sitemap.updateSelector(selector, newSelector);
        return sitemap;
    },
    cancelSelectorEditing: function (button) {

        // cancel possible element selection
        // this.contentScript.removeCurrentContentSelector().done(function() {
        //     this.showSitemapSelectorList();
        // }.bind(this));
        this.showSitemapSelectorList();
    },
    // 添加新选择器
    addSelector: function () {
        var parentSelectorId = this.state.currentParentSelectorId;
        var sitemap = this.state.currentSitemap;

        var selector = new Selector({
            parentSelectors: [parentSelectorId],
            type: 'SelectorText',
            multiple: false
        });
        // 修改选择器
        this._editSelector(selector, sitemap);
    },
    // 删除选择器
    deleteSelector: function (button) {

        var sitemap = this.state.currentSitemap;
        var selector = $(button).closest("tr").data('selector');
        sitemap.deleteSelector(selector);

        // this.store.saveSitemap(sitemap, function () {
        //     this.showSitemapSelectorList();
        // }.bind(this));
        this.showSitemapSelectorList();
    },
    deleteSitemap: function (button) {
        var sitemap = $(button).closest("tr").data("sitemap");
        var controller = this;

        // stats
        // this.backgroundScript.incrementDailyStat({
        //     key: "sitemapsDeleted",
        //     increment: 1
        // });

        this.store.deleteSitemap(sitemap, function () {
            controller.showSitemaps();
        });
    },
    // 请求表单验证
    initScrapeSitemapConfigValidation: function(){
		$('#viewport form').bootstrapValidator({
			fields: {
				"requestInterval": {
					validators: {
						numeric: {
							message: '请求间隔必须是数字'
						}
					}
				},
				"pageLoadDelay": {
					validators: {
						numeric: {
							message: '翻页间隔必须是数字'
						}
					}
				},
                "sitemapConfig": {
					validators: {
						notEmpty: {
							message: '不能为空'
						},
						callback: {
							message: '字段选择器格式错误，或缺失_id, startUrl, selectors字段，请检查',
							callback: function(value, validator) {
							    try{
							        var val = JSON.parse(value);
							        if (!val['url']) throw 'KeyError';
							        // if (!val['dynamic']) throw 'KeyError';
							        // if (!val['proxy']) throw 'KeyError';
							        if (!val['header']) throw 'KeyError';
							        if (!val['form']) throw 'KeyError';
							        if (!val['cookie']) throw 'KeyError';
							        if (!val['name']) throw 'KeyError';
							        if (!val['method']) throw 'KeyError';
                                } catch (error){
							        return false;
                                }
                                return true;
							}
						}
					}
				},
				"sitemapFields": {
					validators: {
						notEmpty: {
							message: '不能为空'
						},
                        regex: {
						    regexp: /"selectors":\[.+\]/,
                            message: 'selectors选择器为空，请添加字段',
                        },
						callback: {
							message: '字段选择器格式错误，或缺失_id, startUrl, selectors字段，请检查',
							callback: function(value, validator) {
							    try{
							        var val = JSON.parse(value);
							        if (!val['_id']) throw 'KeyError';
							        if (!val['startUrl']) throw 'KeyError';
							        if (!val['selectors']) throw 'KeyError';
                                } catch (error){
							        return false;
                                }
                                return true;
							}
						}
					}
				}
			}
		});
	},
    // 保存表单验证
    initScrapeSitemapSaveValidation: function(){
		$('#viewport form').bootstrapValidator({
			fields: {
                "sitemapConfigSave": {
					validators: {
						notEmpty: {
							message: '不能为空'
						},
						callback: {
							message: '字段选择器格式错误，或缺失_id, startUrl, selectors字段，请检查',
							callback: function(value, validator) {
							    try{
							        var val = JSON.parse(value);
							        if (!val['url']) throw 'KeyError';
							        // if (!val['dynamic']) throw 'KeyError';
							        // if (!val['proxy']) throw 'KeyError';
							        if (!val['header']) throw 'KeyError';
							        if (!val['form']) throw 'KeyError';
							        if (!val['cookie']) throw 'KeyError';
							        if (!val['name']) throw 'KeyError';
							        if (!val['method']) throw 'KeyError';
                                } catch (error){
							        return false;
                                }
                                return true;
							}
						}
					}
				},
				"sitemapFieldsSave": {
					validators: {
						notEmpty: {
							message: '不能为空'
						},
                        regex: {
						    regexp: /"selectors":\[.+\]/,
                            message: 'selectors选择器为空，请添加字段',
                        },
						callback: {
							message: '字段选择器格式错误，或缺失_id, startUrl, selectors字段，请检查',
							callback: function(value, validator) {
							    try{
							        var val = JSON.parse(value);
							        if (!val['_id']) throw 'KeyError';
							        if (!val['startUrl']) throw 'KeyError';
							        if (!val['selectors']) throw 'KeyError';
                                } catch (error){
							        return false;
                                }
                                return true;
							}
						}
					}
				}
			}
		});
	},
    // 配置请求参数
    showScrapeSitemapConfigPanel: function() {
        this.setActiveNavigationButton('sitemap-scrape');
        // 获取sitemap JSON数据
        var sitemap = this.state.currentSitemap;
        var sitemapJSON = sitemap.exportSitemap();
        var sitemapConfig = JSON.stringify(window.CONFIG_DATA);
        var scrapeConfigPanel = ich.SitemapScrapeConfig({
            sitemapConfig: sitemapConfig,
            sitemapJSON: sitemapJSON
        });
        $("#viewport").html(scrapeConfigPanel);
        // 表单验证
        this.initScrapeSitemapConfigValidation();
        return true;
    },
    // 开始任务
    scrapeSitemap: function () {
        if(!this.isValidForm()) {
            return false;
        }
        var sitemap = this;
        // stats
        // this.backgroundScript.incrementDailyStat({
        //     key: "scrapingJobsRun",
        //     increment: 1
        // });
        // 请求间隔
        var requestInterval = parseInt($("input[name=requestInterval]").val() ? $("input[name=requestInterval]").val() : 0);
        // 翻页间隔
        var pageLoadDelay = parseInt($("input[name=pageLoadDelay]").val() ? $("input[name=pageLoadDelay]").val() : 0);
        // 选择器字段
        var selectedField = $('#sitemapFields').val();
        // 任务配置
        var config = $('#sitemapConfig').val();
        // 字段验证
        if (JSON.parse(config)['name'] === 'config' || JSON.parse(selectedField)['_id'] === 'config'){
            sitemap.getFormValidator().destroy();
            $(".scraping-in-progress").html('配置名称不能为config， 请修改"任务配置"中"name"参数或"字段选择器"中"_id"参数')
                .removeClass("hide alert-success").addClass("alert-danger");
            $("#submit-scrape-sitemap").closest(".form-group").hide();
            return true;
        }
        // 数据
        var request = {
            scrapeSitemap: true,
            selectedField: JSON.parse(selectedField),
            requestInterval: requestInterval,
            pageLoadDelay: pageLoadDelay,
            config: JSON.parse(config)
        };
        // 推送到tornado
        $.ajax({
            url: "/crawler/start",
            type : "post",
            async: true,
            data: JSON.stringify(request)
        }).done(function (data){
            if (data.state){
                // 更改运行样式
                sitemap.getFormValidator().destroy();
                $(".scraping-in-progress").removeClass("hide");
                $("#submit-scrape-sitemap").closest(".form-group").hide();
                $("#scrape-sitemap-config input").prop('disabled', true);
                $("textarea[class=form-control]").prop('disabled', true);
            } else {
                // 更改运行样式
                sitemap.getFormValidator().destroy();
                $(".scraping-in-progress").html(data.message).removeClass("hide alert-success").addClass("alert-danger");
                $("#submit-scrape-sitemap").closest(".form-group").hide();
            }
        }).fail(function (data){
            // 更改运行样式
            sitemap.getFormValidator().destroy();
            $(".scraping-in-progress").html('发送数据失败, 请检查参数.').removeClass("hide alert-success").addClass("alert-danger");
            $("#submit-scrape-sitemap").closest(".form-group").hide();
        });
        // 插件版运行任务
        // chrome.runtime.sendMessage(request, function (response) {
        //     this.browseSitemapData();
        // }.bind(this));
        return true;
    },
    sitemapListBrowseSitemapData: function (button) {
        var sitemap = $(button).closest("tr").data("sitemap");
        this.setStateEditSitemap(sitemap);
        this.browseSitemapData();
    },
    browseSitemapData: function () {
        this.setActiveNavigationButton('sitemap-browse');
        var sitemap = this.state.currentSitemap;
        this.store.getSitemapData(sitemap, function (data) {

            var dataColumns = sitemap.getDataColumns();

            var dataPanel = ich.SitemapBrowseData({
                columns: dataColumns
            });
            $("#viewport").html(dataPanel);

            // display data
            // Doing this the long way so there aren't xss vulnerubilites
            // while working with data or with the selector titles
            var $tbody = $("#sitemap-data tbody");
            data.forEach(function (row) {
                var $tr = $("<tr></tr>");
                dataColumns.forEach(function (column) {
                    var $td = $("<td></td>");
                    var cellData = row[column];
                    if (typeof cellData === 'object') {
                        cellData = JSON.stringify(cellData);
                    }
                    $td.text(cellData);
                    $tr.append($td);
                });
                $tbody.append($tr);
            });
        }.bind(this));

        return true;
    },

    showSitemapExportDataCsvPanel: function () {
        this.setActiveNavigationButton('sitemap-export-data-csv');

        var sitemap = this.state.currentSitemap;
        var exportPanel = ich.SitemapExportDataCSV(sitemap);
        $("#viewport").html(exportPanel);

        // generate data
        $(".download-button").hide();
        this.store.getSitemapData(sitemap, function (data) {
            var blob = sitemap.getDataExportCsvBlob(data);
            $(".download-button a").attr("href", window.URL.createObjectURL(blob));
            $(".download-button a").attr("download", sitemap._id + ".csv");
            $(".download-button").show();
        }.bind(this));

        return true;
    },
    // 元素选择器
    selectSelector: function (button) {
        // 选择器文本框
        var input = $(button).closest(".form-group").find("input.selector-value");
        // 当前sitemap
        var sitemap = this.getCurrentlyEditedSelectorSitemap();
        // 当前selector
        var selector = this.getCurrentlyEditedSelector();
        // 选择器父容器id["_root"]
        var currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
        // 父容器选择器
        var parentCSSSelector = sitemap.selectors.getParentCSSSelectorWithinOnePage(currentStateParentSelectorIds);
        // 开启当前css选择器
        var deferredSelector = this.contentScript.selectSelector({
            parentCSSSelector: parentCSSSelector,
            allowedElements: selector.getItemCSSSelector(),
            selectorType: $("#edit-selector select[name=type]").val()
        });

        deferredSelector.done(function(result) {
            $(input).val(result.CSSSelector);
            // 更新选择器字段的验证
            var validator = this.getFormValidator();
            validator.revalidateField(input);
            // @TODO how could this be encapsulated?
            // update header row, data row selectors after selecting the table. selectors are updated based on tables
            // inner html
            if(selector.type === 'SelectorTable') {
                this.getSelectorHTML().done(function(html) {
                    var tableHeaderRowSelector = SelectorTable.getTableHeaderRowSelectorFromTableHTML(html);
                    var tableDataRowSelector = SelectorTable.getTableDataRowSelectorFromTableHTML(html);
                    $("input[name=tableHeaderRowSelector]").val(tableHeaderRowSelector);
                    $("input[name=tableDataRowSelector]").val(tableDataRowSelector);
                    var headerColumns = SelectorTable.getTableHeaderColumnsFromHTML(tableHeaderRowSelector, html);
                    this.renderTableHeaderColumns(headerColumns);
                }.bind(this));
            }

        }.bind(this));
    },

    getCurrentStateParentSelectorIds: function() {

        var parentSelectorIds = this.state.editSitemapBreadcumbsSelectors.map(function(selector) {
            return selector.id;
        });

        return parentSelectorIds;
    },

    selectTableHeaderRowSelector: function(button) {

        var input = $(button).closest(".form-group").find("input.selector-value");
        var sitemap = this.getCurrentlyEditedSelectorSitemap();
        var selector = this.getCurrentlyEditedSelector();
        var currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
        var parentCSSSelector = sitemap.selectors.getCSSSelectorWithinOnePage(selector.id, currentStateParentSelectorIds);

        var deferredSelector = this.contentScript.selectSelector({
            parentCSSSelector: parentCSSSelector,
            allowedElements: "tr"
        });

        deferredSelector.done(function(result) {
            var tableHeaderRowSelector = result.CSSSelector;
            $(input).val(tableHeaderRowSelector);

            this.getSelectorHTML().done(function(html) {
                var headerColumns = SelectorTable.getTableHeaderColumnsFromHTML(tableHeaderRowSelector, html);
                this.renderTableHeaderColumns(headerColumns);
            }.bind(this));

            // update validation for selector field
            var validator = this.getFormValidator();
            validator.revalidateField(input);

        }.bind(this));
    },

    selectTableDataRowSelector: function(button) {
        var input = $(button).closest(".form-group").find("input.selector-value");
        var sitemap = this.getCurrentlyEditedSelectorSitemap();
        var selector = this.getCurrentlyEditedSelector();
        var currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
        var parentCSSSelector = sitemap.selectors.getCSSSelectorWithinOnePage(selector.id, currentStateParentSelectorIds);

        var deferredSelector = this.contentScript.selectSelector({
            parentCSSSelector: parentCSSSelector,
            allowedElements: "tr"
        });
        deferredSelector.done(function(result) {
            $(input).val(result.CSSSelector);
            // update validation for selector field
            var validator = this.getFormValidator();
            validator.revalidateField(input);
        }.bind(this));
    },

    /**
     * update table selector column editing fields
     */
    renderTableHeaderColumns: function(headerColumns) {

        // reset previous columns
        var $tbody = $(".feature-columns table tbody");
        $tbody.html("");
        headerColumns.forEach(function(column) {
            var $row = ich.SelectorEditTableColumn(column);
            $tbody.append($row);
        });
    },

    /**
     * Returns HTML that the current selector would select
     */
    getSelectorHTML: function() {

        var sitemap = this.getCurrentlyEditedSelectorSitemap();
        var selector = this.getCurrentlyEditedSelector();
        var currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
        var CSSSelector = sitemap.selectors.getCSSSelectorWithinOnePage(selector.id, currentStateParentSelectorIds);
        var deferredHTML = this.contentScript.getHTML({CSSSelector: CSSSelector});

        return deferredHTML;
    },
    // 选择器-显示元素
    previewSelector: function (button) {
        if (!$(button).hasClass('preview')) {
            var sitemap = this.getCurrentlyEditedSelectorSitemap();
            var selector = this.getCurrentlyEditedSelector();
            var currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
            var parentCSSSelector = sitemap.selectors.getParentCSSSelectorWithinOnePage(currentStateParentSelectorIds);
            var deferredSelectorPreview = this.contentScript.previewSelector({
                parentCSSSelector: parentCSSSelector,
                elementCSSSelector: selector.selector
            });
            deferredSelectorPreview.done(function() {
                $(button).addClass("preview");
            });
        } else {
            this.contentScript.removeCurrentContentSelector();
            $(button).removeClass("preview");
        }
    },
    previewClickElementSelector: function(button) {

        if (!$(button).hasClass('preview')) {

            var sitemap = this.state.currentSitemap;
            var selector = this.getCurrentlyEditedSelector();
            var currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
            var parentCSSSelector = sitemap.selectors.getParentCSSSelectorWithinOnePage(currentStateParentSelectorIds);

            var deferredSelectorPreview = this.contentScript.previewSelector({
                parentCSSSelector: parentCSSSelector,
                elementCSSSelector: selector.clickElementSelector
            });

            deferredSelectorPreview.done(function() {
                $(button).addClass("preview");
            });
        } else {
            this.contentScript.removeCurrentContentSelector();
            $(button).removeClass("preview");
        }
    },
    previewTableRowSelector: function(button) {

        if (!$(button).hasClass('preview')) {

            var sitemap = this.getCurrentlyEditedSelectorSitemap();
            var selector = this.getCurrentlyEditedSelector();
            var currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
            var parentCSSSelector = sitemap.selectors.getCSSSelectorWithinOnePage(selector.id, currentStateParentSelectorIds);
            var rowSelector = $(button).closest(".form-group").find("input").val();

            var deferredSelectorPreview = this.contentScript.previewSelector({
                parentCSSSelector: parentCSSSelector,
                elementCSSSelector: rowSelector
            });

            deferredSelectorPreview.done(function() {
                $(button).addClass("preview");
            });
        } else {
            this.contentScript.removeCurrentContentSelector();
            $(button).removeClass("preview");
        }
    },
    previewSelectorFromSelectorTree: function (button) {
        if (!$(button).hasClass('preview')) {
            var sitemap = this.state.currentSitemap;
            var selector = $(button).closest("tr").data('selector');
            var currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
            var parentCSSSelector = sitemap.selectors.getParentCSSSelectorWithinOnePage(currentStateParentSelectorIds);
            var deferredSelectorPreview = this.contentScript.previewSelector({
                parentCSSSelector: parentCSSSelector,
                elementCSSSelector: selector.selector
            });
            deferredSelectorPreview.done(function() {
                $(button).addClass("preview");
            });
        } else {
            this.contentScript.removeCurrentContentSelector();
            $(button).removeClass("preview");
        }
    },
    // sitemap数据预览入口
    previewSelectorDataFromSelectorTree: function (button) {
        var sitemap = this.state.currentSitemap;
        var selector = $(button).closest("tr").data('selector');
        this.previewSelectorData(sitemap, selector.id);
    },
    // 数据预览入口函数
    previewSelectorDataFromSelectorEditing: function() {
        var sitemap = this.state.currentSitemap.clone();
        var selector = sitemap.getSelectorById(this.state.currentSelector.id);
        var newSelector = this.getCurrentlyEditedSelector();
        sitemap.updateSelector(selector, newSelector);
        // 选择器-数据预览
        this.previewSelectorData(sitemap, newSelector.id);
    },
    /**
     * Returns a list of selector ids that the user has opened
     * @returns {Array}
     */
    getStateParentSelectorIds: function(){
        var parentSelectorIds = [];
        this.state.editSitemapBreadcumbsSelectors.forEach(function(selector){
            parentSelectorIds.push(selector.id);
        });
        return parentSelectorIds;
    },
    // 显示预览数据
    showPreviewSelectorData: function (response){
        if (response.length === 0) {
            return
        }
        var dataColumns = Object.keys(response[0]);
        // 加载模板
        var $dataPreviewPanel = ich.DataPreview({
            columns: dataColumns
        });
        $("body").append($dataPreviewPanel);
        $dataPreviewPanel.modal({keyboard: true});
        // display data
        // Doing this the long way so there aren't xss vulnerubilites
        // while working with data or with the selector titles
        var $tbody = $("tbody", $dataPreviewPanel);
        response.forEach(function (row) {
            var $tr = $("<tr></tr>");
            dataColumns.forEach(function (column) {
                var $td = $("<td></td>");
                var cellData = row[column];
                if (typeof cellData === 'object') {
                    cellData = JSON.stringify(cellData);
                }
                $td.text(cellData);
                $tr.append($td);
            });
            $tbody.append($tr);
        });
        // var windowHeight = $(".sidebar").height();
        // $(".data-preview-modal .modal-body").height(windowHeight - 130);
        // 关闭后移除模态框
        $dataPreviewPanel.on("hidden.bs.modal", function () {
            $(this).remove();
        });
    },
    // 选择器-数据预览
    previewSelectorData: function (sitemap, selectorId) {
        // data preview will be base on how the selector tree is opened
        var parentSelectorIds = this.getStateParentSelectorIds();
        var request = {
            previewSelectorData: true,
            sitemap: JSON.parse(JSON.stringify(sitemap)),
            parentSelectorIds: parentSelectorIds,
            selectorId: selectorId
        };
        // 提取数据
        // if (request.extractData){
			// var extractor = new window.collect.DataExtractor(request);
			// var deferredData = extractor.getData();
			// deferredData.done(function(data){
			// 	this.showPreviewSelectorData(data);
			// }.bind(this));
			// return true;
		// 预览数据
		// } else if (request.previewSelectorData){
        var extractor = new window.collect.DataExtractor(request);
        var deferredData = extractor.getSingleSelectorData(request.parentSelectorIds, request.selectorId);
        deferredData.done(function(data){
            this.showPreviewSelectorData(data);
        }.bind(this));
        return true;
		// 调用ContentScript交互
		// } else if (request.contentScriptCall){
		// 	var contentScript = getContentScript("ContentScript");
		// 	var deferredResponse = contentScript[request.fn](request.request);
		// 	deferredResponse.done(function(response) {
		// 		this.showPreviewSelectorData(response);
		// 	}.bind(this));
		// 	return true;
		// }
    },
    /**
     * Add start url to sitemap creation or editing form
     * @param button
     */
    addStartUrl: function(button) {

        var $startUrlInputField = ich.SitemapStartUrlField();
        $("#viewport .start-url-block:last").after($startUrlInputField);
        var validator = this.getFormValidator();
        validator.addField($startUrlInputField.find("input"));
    },
    /**
     * Remove start url from sitemap creation or editing form.
     * @param button
     */
    removeStartUrl: function(button) {

        var $block = $(button).closest(".start-url-block");
        if($("#viewport .start-url-block").length > 1) {

            // remove from validator
            var validator = this.getFormValidator();
            validator.removeField($block.find("input"));

            $block.remove();
        }
    },
    // 保存配置
    saveConfig: function(){
        // 请求间隔
        var requestInterval = parseInt($("input[name=requestInterval]").val() ? $("input[name=requestInterval]").val() : 0);
        // 翻页间隔
        var pageLoadDelay = parseInt($("input[name=pageLoadDelay]").val() ? $("input[name=pageLoadDelay]").val() : 0);
        // 选择器字段
        var selectedField = $('#sitemapFieldsSave').val();
        // 任务配置
        var config = $('#sitemapConfigSave').val();
        // 数据
        var request = {
            requestInterval: requestInterval,
            pageLoadDelay: pageLoadDelay,
            selectedField: selectedField,
            config: config
        };
        var sitemap = this;
        // 推送到tornado
        $.ajax({
            url: "/data/save",
            type : "post",
            async: true,
            data: request
        }).done(function (data){
            if (data.state){
                // 更改运行样式
                sitemap.getFormValidator().destroy();
                $(".scraping-in-progress").removeClass("hide");
                $('button[action=sitemap-save-button]').closest(".form-group").hide();
                $("textarea[class=form-control]").prop('disabled', true);
            } else {
                // 更改运行样式
                sitemap.getFormValidator().destroy();
                $(".scraping-in-progress").html(data.message).removeClass("hide alert-success").addClass("alert-danger");
                $('button[action=sitemap-save-button]').closest(".form-group").hide();
            }
        }).fail(function (){
            // 更改运行样式
            sitemap.getFormValidator().destroy();
            $(".scraping-in-progress").html('发送数据失败, 请检查参数.').removeClass("hide alert-success").addClass("alert-danger");
            $("#submit-scrape-sitemap").closest(".form-group").hide();
        });
        return true;
    }
};
