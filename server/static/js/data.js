/**
 * Created by Administrator on 2018/1/8.
 */

var initColumns = function (collection_name) {
    $.ajax({
        url: '/data/columns',
        type : "get",
        async: true,
        data: {"collection_name": collection_name}
    }).done(function (data){
        var oTable = TableInit(collection_name, data);
        oTable.destroy();
        oTable.Init();
    }).fail(function (data){
    });
};


var TableInit = function (collection_name, columns) {
    var oTableInit = {};
    // 销毁
    oTableInit.destroy = function (){
        $("#collection_data").bootstrapTable('destroy');
    };
    //初始化Table
    oTableInit.Init = function () {
        $('#collection_data').bootstrapTable({
            url: '/data/collection',            //请求后台的URL（*）
            method: 'get',                      //请求方式（*）
            toolbar: '#toolbar',                //工具按钮用哪个容器
            striped: true,                      //是否显示行间隔色
            cache: false,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
            pagination: true,                   //是否显示分页（*）
            sortable: false,                    //是否启用排序
            sortOrder: "asc",                   //排序方式
            queryParams: oTableInit.queryParams,//传递参数（*）
            sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
            pageNumber:1,                       //初始化加载第一页，默认第一页
            pageSize: 20,                       //每页的记录行数（*）
            pageList: [10, 20, 30, 50],      //可供选择的每页的行数（*）
            search: true,                       //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
            toolbarAlign: 'right',              //toolbar位置
            showColumns: true,                  //是否显示所有的列
            showRefresh: true,                  //是否显示刷新按钮
            minimumCountColumns: 2,             //最少允许的列数
            clickToSelect: true,                //是否启用点击选中行
            // uniqueId: "ID",                  //每一行的唯一标识，一般为主键列
            showToggle:true,                    //是否显示详细视图和列表视图的切换按钮
            cardView: false,                    //是否显示详细视图
            detailView: false,                  //是否显示父子表
            showExport: true,                   //是否显示导出
            exportDataType: 'all',              //basic', 'all', 'selected'.
            columns: columns
        });
    };

    //得到查询的参数
    oTableInit.queryParams = function (params) {
        var temp = {
            collection_name: collection_name,
            // limit: params.limit,   //页面大小
            // offset: params.offset,  //页码
        };
        return temp;
    };
    return oTableInit;
};