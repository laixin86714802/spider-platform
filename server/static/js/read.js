/**
 * Created by Administrator on 2018/1/8.
 */

var initColumns = function (name) {
    $.ajax({
        url: '/read/collection',
        type : "get",
        async: true,
        data: {"name": name}
    }).done(function (data){
        // 表格填充
        $('#start-task').data("name", data.data);
        $('#delete-task').data("name", data.data);
        var oFormInit = FormInit(data.data.config);
        oFormInit.Init();
        oFormInit.Fill();
        var oTableInit = TableInit(data.data.selectedField.selectors);
        oTableInit.destroy();
        oTableInit.Init();
        // 按钮注册
        buttonInit();
    }).fail(function (data){
    });
};
// 表单函数
var FormInit = function (config){
    var oFormInit = {};
    // 表单初始化
    oFormInit.Init = function (){
        $('#config_form').html('');
    };
    // 赋值
    oFormInit.Fill = function (){
        $('#config_form').html(`<table class="table table-bordered">
            <thead>
                <tr><th>参数名</th><th>参数值</th></tr>
            </thead>
            <tbody>
                <tr><td>配置名称</td><td>${config.name}</td></tr>
                <tr><td>请求方式</td><td>${config.method}</td></tr>
                <tr><td>url</td><td>${config.url}</td></tr>
                <tr><td>请求头</td><td>${JSON.stringify(config.header)}</td></tr>
                <tr><td>cookie</td><td>${JSON.stringify(config.cookie)}</td></tr>
                <tr><td>post表单</td><td>${JSON.stringify(config.form)}</td></tr>
                <tr><td>动态解析</td><td>${config.dunamic}</td></tr>
                <tr><td>ip代理</td><td>${config.proxy}</td></tr>
            </tbody>
        </table>`);
    };
    return oFormInit;
};

// 选择器函数
var TableInit = function (selectedField) {
    var oTableInit = {};
    // 销毁
    oTableInit.destroy = function (){
        $('#collection_data').bootstrapTable('destroy');
    };
    //初始化Table
    oTableInit.Init = function () {
        // id对应
        var idList = {};
        selectedField.map((i, j) => idList[i['id']] = j);
        var result = selectedField.map((i, j) => {
            var obj = {};
            obj = i;
            obj['name'] = i['id'];
            obj['id'] = idList[i['id']];
            if (obj['parentSelectors'][0] === '_root'){
                obj['parentId'] = null;
            } else {
                obj['parentId'] = idList[i['parentSelectors'][0]];
            }
            delete obj['parentSelectors'];
            return obj;
        });

        $('#collection_data').bootstrapTable({
            class: 'table table-hover table-bordered',
            data: result,
            pagination: false,
            treeView: true,
            treeId: "id",
            treeField: "name",
            columns: [{
                field: 'name',
                title: '选择器名称'
            },{
                field: 'selector',
                title: '选择器',
            },{
                field: 'type',
                title: '选择器类型',
            },{
                field: 'multiple',
                title: '多元素'
            },{
                field: 'regex',
                title: '正则表达式'
            }]
        });
        $("#expandAllTree").on('click',function(){
            $('#tree_table').bootstrapTable("expandAllTree")
        });
        $("#collapseAllTree").on('click',function(){
            $('#tree_table').bootstrapTable("collapseAllTree")
        });
    };
    return oTableInit;
};

// 按钮初始化函数
var buttonInit = function (){
    $('#start-task').bind('click', function (){
        var data = $(this).data();
        var config = data.name.config;
        var selectedField = data.name.selectedField;
        var request = {
            scrapeSitemap: true,
            requestInterval: data.name.requestInterval,
            pageLoadDelay: data.name.pageLoadDelay,
            config: config,
            selectedField: selectedField
        };
        $.ajax({
            url: "/crawler/start",
            type : "post",
            async: true,
            data: JSON.stringify(request)
        }).done(function (data){
            if (data.state){
                $('#button-group').hide();
                $(".scraping-in-progress").removeClass("hide");
            } else {
                $('#button-group').hide();
                $(".scraping-in-progress").html(data.message).removeClass("hide alert-success").addClass("alert-danger");
            }
        }).fail(function (){
            $('#button-group').hide();
            $(".scraping-in-progress").html('发送数据失败, 请检查参数.').removeClass("hide alert-success").addClass("alert-danger");
        });
    });
    $('#delete-task').bind('click', function (){
        var data = $(this).data();
        var config = data.name.config;
        var request = {
            name: config.name
        };
        $.ajax({
            url: "/data/delete",
            type : "get",
            async: true,
            data: request
        }).done(function (data){
            if (data.state){
                $('#button-group').hide();
                $(".scraping-in-progress").html('删除配置成功.').removeClass("hide");
                setTimeout(function (){
                    location.reload();
                }, 1500);
            } else {
                $('#button-group').hide();
                $(".scraping-in-progress").html(data.message).removeClass("hide alert-success").addClass("alert-danger");
            }
        }).fail(function (){
            $('#button-group').hide();
            $(".scraping-in-progress").html('发送数据失败, 请检查参数.').removeClass("hide alert-success").addClass("alert-danger");
        });
    });
};