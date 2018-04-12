/**
 * Created by Administrator on 2017/12/8.
 */
$(document).ready(function(){
    // 加载item样式
    item_style();
    // 初始化iframe宽度
    $('iframe').css({"width": $('iframe').parent().width() - 30, "height": "600px"});
    // 浮动显示框
    float_frame()
});
// item栏样式
function item_style () {
    // 更改透明度
    $(".sidebar").on("mouseover",function(){
        $(".closeMenu > span").css({
            opacity:1
        });
    });
    $(".sidebar").on("mouseleave",function(){
        $(".closeMenu > span").css({
            opacity:0.5
        });
    });
    // 获取item宽度
    var moveLeft = $(".span2").width();
    var moveRight = $("#list_left").width();
    // 设置内容块初始位置
    $(".main").css({'margin-left': moveLeft, 'margin-right': moveRight});
    // 显示/隐藏item项目
    var isShow = true;
    $(".closeMenu span").click(function(){
        // 按钮显示/隐藏
        $(this).hide().siblings().show();
        if(isShow){
            $("#list_left").animate({
                'margin-right': -(moveRight-30)//30 刚好显示icon图标
            }, 200, "linear",function(){
                isShow = false;
                $(".closeMenu > span").css({
                    opacity: 1
                });
            });
            $(".main").animate({'margin-left': moveLeft, 'margin-right': 30}, "linear");
            setTimeout(function(){
                // iframe滑动
                $('iframe').animate({"width": $('iframe').parent().width() - 30, "height": "600px"});
                // 显示框滑动
                $('.float-frame').animate({'width': $('.main').width() + $('.span2').width()});
                $('.show-element').animate({'float': 'right'});
            }, 500);
        }else{
            $("#list_left").animate({
                'margin-right': 0
            }, 200, "linear",function(){
                isShow = true;
            });
            $(".main").animate({'margin-left': moveLeft, 'margin-right': moveRight},"linear");
            setTimeout(function(){
                // iframe滑动
                $('iframe').animate({"width": $('iframe').parent().width() - 30, "height": "600px"});
                // 显示框滑动
                $('.float-frame').animate({'width': $('.main').width() + $('.span2').width()});
                $('.show-element').animate({'float': 'right'});
            }, 500);
        }
    });
}
// 请求翻页
function getItemList(index, successCB) {
    $.ajax({
        url: window.location.origin + '/items/list/',
        type: 'get',
        dataType: 'json',
        data: {'index': index, 'count': 5},
        success: function(res) {
            successCB(res);
        },
        error: function (e) {
            console.log('获取配置列表失败, 原因未知');
        }
    });
}
// 成功请求
function getItemListSuccess(res) {
    // 清空数据
    $('.item-style').html('');
    // 返回方法
    $('.item-style').append('<div class="return-button">' +
        '<span class="glyphicon glyphicon-chevron-left"> 返回</span></div>');
    // 绑定事件
    $('.return-button').on('click', function(){
        $('.item-style').html('<button type="button" class="btn btn-primary btn-lg btn-block" onclick="load_items()">加载配置</button>' +
            '<button type="button" class="btn btn-primary btn-lg btn-block" onclick="insert_items()">新建配置</button>');
        $('.table_total').html('');
        $('#page').html('');
    });
    var text = '';
    for (var i in res.data){
        var name = res.data[i].name;
        var items = JSON.parse(res.data[i].items);
        text = '<div class="panel panel-default" id="item_' + i + '">'
                 + '<div class="panel-heading">'
                 + '<h4 class="panel-title">'
                 + '<a data-toggle="collapse" data-parent="#accordion" href="#collapse' + i + '">'
                 + '配置名称: ' + name + '</a></h4></div>'
                 + '<div id="collapse' + i + '" class="panel-collapse collapse">'
                 + '<div class="panel-body">'
                 + '<table class="table table-hover">'
                 + '<thead><tr><th>字段名</th><th>字段值</th></tr></thead><tbody>';
        for (var key in items){
            text += '<tr><td>' + key + '</td><td>' + items[key] + '</td></tr>';
        }
        text += '</tbody></table></div>';
        // 按钮
        text += '<div class="modal-footer">'
            + '<button type="button" class="btn btn-default btn-sm" onclick="$(\'#getModal\').modal(\'hide\');">取消</button>'
            + '<button type="button" class="btn btn-danger btn-sm" onclick="delConf($(\'#item_' + i +'\'))">删除</button>'
            + '<button type="button" class="btn btn-primary btn-sm" onclick="writeConfToWeb($(\'#conf_list_' + i +'\'))">确定</button>'
            + '</div></div></div>';
        $('.item-style').append(text);
    }
    $('.item-style').append('</div>');
}
// 返回列表
// 分页列表
function get_count() {
    $.ajax({
        url: window.location.origin + '/items/count/',
        type: 'get',
        dataType: 'json',
        success: function(res) {
            $('#page').paging(res.count, 5);
            // 写入条数
            $('.table_total').html('共<span id="total-num">' + res.count + '</span>条数据');
        }
    });
    // 分页点击
    $('#page').delegate('.page_request', 'click', function () {
        setTimeout(function () {
            // 获取分页数pageNum
            index = Number($('#page > span.current').attr('pagenumer'));
            // 请求
            getItemList(index, getItemListSuccess);
        }, 10);
    });
}
// 加载配置
function load_items() {
    // 请求首页
    getItemList(1, getItemListSuccess);
    // 分页列表
    get_count();
}
// 新增配置
function insert_items() {
    // 清空数据
    $('.item-style').html('');
    // 返回方法
    $('.item-style').append('<div class="return-button">' +
        '<span class="glyphicon glyphicon-chevron-left"> 返回</span>');
    // 添加选择, 分页, 详情按钮
    var btn_text = '<button class="btn-custom" onclick="mouse_event()" id="select_attr">元素选择</button>'
                 + '<button class="btn-custom">分页选择</button>'
                 + '<button class="btn-custom">详情选择</button>';
    $('.item-style').append(btn_text);
    // 绑定事件
    $('.return-button').on('click', function(){
        $('.item-style').html('<button type="button" class="btn btn-primary btn-lg btn-block" onclick="load_items()">加载配置</button>' +
            '<button type="button" class="btn btn-primary btn-lg btn-block" onclick="insert_items()">新建配置</button>');
        $('.table_total').html('');
        $('#page').html('');
    });
    // 采集字段表格
    var sel_table_head = '<table class="table table-hover">'
        + '    <caption>采集字段表格</caption>'
        + '    <thead>'
        + '        <tr>'
        + '            <th>字段名</th>'
        + '            <th>css选择器</th>'
        + '            <th>值</th>'
        + '            <th>类型</th>'
        + '        </tr>'
        + '    </thead>'
        + '    <tbody>';
    var sel_table_body = '        <tr>'
        + '            <td>标题</td>'
        + '            <td>.item-table > span > attr</td>'
        + '            <td>runoob.com</td>'
        + '            <td>'
        + '                <select class="select-form">'
        + '                <option>元素集</option>'
        + '                <option>单元素</option>'
        + '                <option>列表元素</option>'
        + '                <option>滚动下拉</option>'
        + '                <option>点击元素</option>'
        + '            </select>'
        + '            </td>'
        + '            <td><button type="button" class="btn-custom" onclick="hehe()"><span class="glyphicon glyphicon-trash"></span></button></td>'
        + '        </tr>';
    var sel_table_tail = '    </tbody>'
        + '</table>';
    $('.item-style').append(sel_table_head + sel_table_body + sel_table_tail);
}
// 删除配置
function delConf (obj) {
    var name = $(obj).find('h4 a').text();
    // 清空模态框
    $('.fade').html('');
    // var reg = /\d+/;
    // var num = reg.exec(name);
    // 加载模态框
    var text = + '<div class="modal fade">'
             + '<div class="modal-dialog">'
             + '<div class="modal-content">'
             + '<div class="modal-header">'
             + '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>'
             + '<h4 class="modal-title" id="myModalLabel">删除该配置</h4>'
             + '</div>'
             + '<div class="modal-body">' + name + '</div>'
             + '<div class="modal-footer">'
             + '<button type="button" class="btn btn-default" data-dismiss="modal">取消</button>'
             + '<button type="button" class="btn btn-primary" id="delete_items">确定</button>'
             + '</div></div></div></div>';
    $('.fade').html(text);
    // 移除事件
    $("#delete_items").off('click');
    // 绑定事件
    $("#delete_items").on('click', function(){
        var item_name = ($(this).parent('div').prev().text()).replace(/配置名称: /, '');
        if (item_name){
            $.ajax({
                url: window.location.origin + '/items/delete/',
                method: 'delete',
                dataType: 'json',
                async: true,
                data: {'name': item_name},
                success: function(data){
                    $('.fade').modal('hide');
                    $('.fade').html('');
                    if (data.status === 10000){
                        var text = + '<div class="modal fade">'
                                     + '<div class="modal-dialog">'
                                     + '<div class="modal-content">'
                                     + '<div class="modal-header">'
                                     + '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>'
                                     + '<h4 class="modal-title" id="myModalLabel">删除成功</h4>'
                                     + '</div>'
                                     + '<div class="modal-body">' + name + ' 已删除</div>'
                                     + '<div class="modal-footer">'
                                     + '<button type="button" class="btn btn-default" data-dismiss="modal">取消</button>'
                                     + '<button type="button" class="btn btn-primary" data-dismiss="modal">确定</button>'
                                     + '</div></div></div></div>';
                        $('.fade').html(text);
                        setTimeout( function () {
                                $('.fade').modal('show');
                            }, 800
                        );
                        // 请求首页
                        getItemList(1, getItemListSuccess);
                        // 分页列表
                        get_count();
                    }else{
                        $('.fade').modal('hide');
                        $('.fade').html('');
                        var text = + '<div class="modal fade">'
                                     + '<div class="modal-dialog">'
                                     + '<div class="modal-content">'
                                     + '<div class="modal-header">'
                                     + '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>'
                                     + '<h4 class="modal-title" id="myModalLabel">删除失败</h4>'
                                     + '</div>'
                                     + '<div class="modal-body">' + name + ' 删除失败</div>'
                                     + '<div class="modal-footer">'
                                     + '<button type="button" class="btn btn-default" data-dismiss="modal">取消</button>'
                                     + '<button type="button" class="btn btn-primary" data-dismiss="modal">确定</button>'
                                     + '</div></div></div></div>';
                        $('.fade').html(text);
                        setTimeout( function () {
                                $('.fade').modal('show');
                            }, 800
                        );
                        // 请求首页
                        getItemList(1, getItemListSuccess);
                        // 分页列表
                        get_count();
                    }
                },
                error: function (e) {
                }
            })
        } else{
            alert('获取配置名称错误');
        }
    });
    // 显示模态框
    $('.fade').modal('show');
}
// 生成css选择器
function cssSel(obj) {
    var dom = $(obj).get(0);
    var path = "";
    for (; dom && dom.nodeType == 1; dom = dom.parentNode) {
        var index = 1;
        for (var sib = dom.previousSibling; sib; sib = sib.previousSibling) {
            if (sib.nodeType == 1 && sib.tagName == dom.tagName){
                index++;
            }
        }
        var xname =  dom.tagName.toLowerCase();
        if (dom.id) {
            xname += "[@id=\"" + dom.id + "\"]";
        } else {
            if (index > 0)
            xname += "[" + index + "]";
        }
        path = "/" + xname + path;
    }
    path = path.replace("html[1]/body[1]/","html/body/");
    // 开始转换 xpath 为 css path
    // 转换 // 为 " "
    xpath = path.replace(/\/\//g, " ");
    // 转换 / 为 >
    xpath = xpath.replace(/\//g, ">");
    // 转换 [elem] 为 :eq(elem) ： 规则 -1
    xpath = xpath.replace(/\[([^@].*?)\]/ig, function(matchStr,xPathIndex){
    var cssPathIndex = parseInt(xPathIndex)-1;
        return ":eq(" + cssPathIndex + ")";
    });
    // 1.2 版本后需要删除@
    xpath = xpath.replace(/\@/g, "");
    // 去掉第一个 >
    xpath = xpath.substr(1);
    // 返回jQuery元素
    return xpath;
}
// 移动、点击事件
function mouse_event() {
    // 左上角弹窗
    $('.show-element').css('display', 'block');
    // 鼠标移动事件
    $('*:not(.select-view)').bind({
        'mousemove': function (event) {
            event.stopPropagation();
            var cssName = cssSel($(this));
            $(this).addClass('start-sel');
            // console.log(cssName);
            $(this).attr('title', cssName);
        },
        'mouseout': function (event) {
            event.stopPropagation();
            $(this).toggleClass('start-sel');
        }
    });
    // 鼠标点击事件
    $('*').bind({
        'mousedown': function(event){
            // 弹出框
            event.preventDefault();
            $('.select-view').css('display', 'block');
            $('.select-view').unbind('mousemove').unbind('mouseout').removeClass('start-sel');
            $(".select-view").find("*").unbind('mousemove').unbind('mouseout').removeClass('start-sel');
            // $('.select-view').preventDefault();
            // 取消默认事件、冒泡
            // $('.select-view').stopPropagation();
            event.stopPropagation();
            $(this).addClass('end-sel');
        }
    });
}
function test() {
    // 单击打开
    $('.light.io-cursor-add-CHFG').on('click', function (e) {
        // console.log(getElementXpath(e.toElement));
        var tabs = "";
        var ids = "";
        var classs = "";
        var hrefs = "";
        var tabs = $(this).prop("tagName");
        tabs = tabs.toLowerCase();
        var ids = $(this).attr("id");
        var classs = $(this).attr("class");
        var hrefs = $(this).attr("href");
        console.log(tabs + ';' + ids + ';' + classs + ';' + hrefs);
        var content = "";
        // 鼠标点击＋－切换
        if ($(this).hasClass('io-cursor-add-CHFG')) {
            $(this).removeClass('io-cursor-add-CHFG').addClass('io-cursor-delete-CHFG');
            var contents = $(this).prop('outerHTML');//点击获取数据
        } else {
            $(this).removeClass('io-cursor-delete-CHFG').addClass('io-cursor-add-CHFG');
            content = "";
        }
        //滑动＋点击使选中框
        if ($(this).hasClass('light')) {
            $(this).removeClass('light').addClass('light-green');
        } else {
            $(this).removeClass('light-green').addClass('light');
        }
        return false
    });
    $(this).attr()
}
// 浮动显示框
function float_frame() {
    $('#button-position').on('click', function(){
        // 左侧
        if($(this).attr('class').indexOf('right') !== -1){
            $(this).attr('class', 'glyphicon glyphicon-arrow-left button');
            $('.float-frame').css({'width': $('.main').width() + $('.span2').width()});
            $('.show-element').css({'float': 'right'});
        // 右侧
        }else{
            $(this).attr('class', 'glyphicon glyphicon-arrow-right button');
            $('.show-element').css({'float': 'left'});
        }
    })
}