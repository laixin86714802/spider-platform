/**
 * Created by Administrator on 2017/9/14.
 */
$(function(){
    "use strict";
    // 下方选择栏样式
    // select_frame();
    // frame样式
    $('iframe').css({"width": '100%', "height": "580px"});
    // 浮动显示框
    // float_frame();
    // 模态框方法
    // new_modal(jQuery);
});

// 选择字段
function iframe_mouse_event(){
    // 禁用按钮
    $('div.sidebar > button').attr('disabled', 'disabled');
    window.collect.mouse_event();
}

// 下方选择栏
function select_frame() {
    var src_posi_Y = 0, dest_posi_Y = 0, move_Y = 0, is_mouse_down = false, destHeight = 200;
    $(".expander").mousedown(function(e){
        src_posi_Y = e.pageY;
        is_mouse_down = true;
    });
    $(document).bind("click mouseup",function(e){
        if(is_mouse_down){
          is_mouse_down = false;
        }
    })
    .mousemove(function(e){
        dest_posi_Y = e.pageY;
        move_Y = src_posi_Y - dest_posi_Y;
        src_posi_Y = dest_posi_Y;
        destHeight = $(".sidebar").height() + move_Y;
        if(is_mouse_down){
            $(".sidebar").css("height", destHeight > 30 ? destHeight : 30);
        }
    });
}

// 保存选择
function save_select() {
    if ($('#select-name').val() != ''){
        // 列表多选
        if ($('#multiple').attr('disabled')){
            // 字段名查重
            var now_field_name = [];
            $('#save-sel').find('tr').each(function(){
                now_field_name.push($(this).find('td:first').text());
            });
            if (now_field_name.indexOf($('#select-name').val()) === -1) {

            } else {
                $('#select-name').css({'border-color': '#F66495'});
                $('#select-name').attr('data-content', '名称与已有字段重复');
                $('#select-name').popover('show');
                $('#select-name').focus(function(){
                    $('#select-name').popover('hide');
                });
                $('#select-name').change(function(){
                    $('#select-name').css({'border-color': '#FFFFFF'});
                });
            }
        }
        if ($('#multiple').is(':checked')){
            return multiple_select();
        }
        // 字段名查重
        var now_field_name = [];
        $('#save-sel').find('tr').each(function(){
            now_field_name.push($(this).find('td:first').text());
        });
        if (now_field_name.indexOf($('#select-name').val()) === -1) {
            var sel_table_body = `<tr>
                    <td>${$('#select-name').val()}</td>
                    <td>${$('#select-input').val()}</td>
                    <td>SelectorText</td>
                    <td>${$('#multiple').is(':checked')}</td>
                    <td>_root</td>
                  <td>
                      <button type="button" class="btn btn-info btn-xs">元素预览</button>
                      <button type="button" class="btn btn-info btn-xs">数据预览</button>
                      <button type="button" class="btn btn-info btn-xs">编辑</button>
                      <button type="button" class="btn btn-info btn-xs">删除</button>
                  </td>
                </tr>`;
            $('#save-sel').append(sel_table_body);
            $('.select-view').hide();
            $('.show-element').hide();
        }else {
            $('#select-name').css({'border-color': '#F66495'});
            $('#select-name').attr('data-content', '名称与已有字段重复');
            $('#select-name').popover('show');
            $('#select-name').focus(function(){
                $('#select-name').popover('hide');
            });
            $('#select-name').change(function(){
                $('#select-name').css({'border-color': '#FFFFFF'});
            });
        }
    } else {
        $('#select-name').css({'border-color': '#F66495'});
        $('#select-name').attr('data-content', '名称不为空');
        $('#select-name').popover('show');
        $('#select-name').focus(function(){
            $('#select-name').popover('hide');
        });
        $('#select-name').change(function(){
            $('#select-name').css({'border-color': '#FFFFFF'});
        });
    }
}

// 多列表保存
function multiple_select() {
    // 列表选择
    $('#multiple').attr({'disabled': 'disabled', 'checked': 'checked'});
    $('.show-element').prepend('<p>请选择同列表元素</p>').css('display', 'none');
    $('.select-view').css('display','none');
    iframe_mouse_event();
}

// 删除选择
function save_del(obj) {
    $('#modal-temp').new_modal({
        backdrop: false,      // 点击模态框外部时不会关闭模态框
        title: '删除',     // 模态框中标题
        content: '确定删除 ' + $(obj).parent().siblings().eq(0).text() + ' 字段？',   // 模态框中内容
        enter_function: false // 确认键绑定函数
    });
    $('#modal-temp').find('button').eq(-1).removeAttr("data-dismiss").attr({"id": "save_del_confirm"});

    $('#save_del_confirm').on('click', function () {
        var iframe_css = $(obj).parent().prev().prev().prev().text();
        var iframe_elem = $(window.frames["collect"].document).find(iframe_css.split('::')[0]);
        // 移除边框效果
        iframe_elem.removeClass('end-sel');
        $('#modal-temp').modal('hide');
        // 删除表格
        $(obj).parent().parent().remove();
    });
    $('#modal-temp').modal();
}

// 浮动显示框
function float_frame() {
    $('.float-frame').css('top', $('body > nav').height());
    $('#button-position').on('click', function () {
        // 左侧
        if ($(this).attr('class').indexOf('right') !== -1) {
            $(this).attr('class', 'glyphicon glyphicon-arrow-left button');
            $('.float-frame').css({'right': '0px'});
            // 右侧
        } else {
            $(this).attr('class', 'glyphicon glyphicon-arrow-right button');
            $('.float-frame').css('right', '');
        }
    });
}

// 模态框
function new_modal($) {
    $.fn.new_modal = function (options) {
        options = $.extend({}, $.fn.new_modal.defaults, options || {});
        if (options.backdrop) {
            $(this).attr("data-backdrop", "false");
        }
        $(this).attr({
            "class": "modal fade"
        });
        let enter_content;
        if (!options.enter_function) {
            enter_content = `<button type="button" class="btn btn-primary" data-dismiss="modal">确定</button>`;
        } else {
            enter_content = `<button type="button" class="btn btn-primary" onclick=${options.enter_function}()>确定</button>`;
        }
        $(this).html(`<div class="modal-dialog">
        <div class="modal-content">
        <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
        <h4 class="modal-title" id="myModalLabel">${options.title}</h4>
        </div>
        <div class="modal-body">${options.content}</div>
        <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal">取消</button>
        ${enter_content}
        </div></div>`
        );
        return this;
    };

    $.fn.new_modal.defaults = {
        backdrop: true, // 点击模态框外部时不会关闭模态框
        title: '默认标题', // 模态框中标题
        content: '默认内容', // 模态框中内容
        enter_function: false // 确认键绑定函数
    };
}

