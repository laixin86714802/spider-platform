/**
 * Created by Administrator on 2017/10/23.
 */
$(function (){
    location.reload();
});

// 生成css选择器
function cssSel(obj) {
    // 判断是否为同一对象
    var sameJqueryObject = function (a, b){
        if (a.is(b) && a.length === b.length){
            return true;
        }else{
            return false;
        }
    };
    // class id选择器
    var domSel = function (dom){
        // 获取属性
        var domName = dom.localName.toLowerCase();
        if (dom.id){
            var domId = '#' + dom.id;
            return domName + domId;
        }
        if (dom.className){
            var domClass = dom.className.split(" ").filter(val => val != 'end-sel' && val != 'start-sel' && val != 'hover').map(val => '.'+ val).join('');
            return domName + domClass;
        }
        return domName;
    };
    // dom对象
    var dom = $(obj).get(0);
    var path = "";
    // 父元素节点
    for (; dom && dom.nodeType === 1; dom = dom.parentNode) {
        var index = 1;
        // 之前的同胞节点
        for (var sib = dom.previousSibling; sib; sib = sib.previousSibling) {
            // 同一标签下
            if (sib.nodeType === 1) {
                index++;
            }
        }
        // 之后的同胞节点
        var flag = 0;
        for (var nex = $(dom).next().get(0); nex; nex = $(nex).next().get(0)) {
            if (nex.nodeType === 1) {
                flag = 1;
                break;
            }
        }
        // 存在兄弟节点
        var thisobj = '';
        if ((flag === 1) || (index > 1 && flag === 0)) {
            thisobj = domSel(dom) + `:nth-child(${index})`;
        // 不存在兄弟节点
        } else {
            thisobj = domSel(dom);
        }
        path = thisobj + path;
        if (sameJqueryObject($(obj), $(path))) {
            return path;
        } else {
            path = ' ' + path;
        }
    }
    return undefined;
}

// 移动、点击事件
function mouse_event() {
    // 左上角弹窗
    $('.show-element', parent.document).css('display', 'block');
    $('*').bind({
        // 鼠标移动事件
        'mousemove': function (event) {
            // 阻止父类冒泡和默认事件
            event.stopPropagation();
            event.preventDefault();
            var cssName = cssSel($(event.target));
            $(event.target).addClass('start-sel');
            // 写入弹窗
            $('#path', parent.document).html(cssName);
            var content = `<div class="attribute">
                               <span>content: </span>
                               <span>${$(event.target).contents().filter(function(){ return this.nodeType === 3; }).text()}</span>
                           </div>`;
            $('#attr', parent.document).html(content);
            var attr_str = $(event.target).clone();
            attr_str.children().remove();
            attr_str = attr_str[0].outerHTML;
            label_content = attr_str.match(/\w+\s*=\s*["|'].*?["|']/g);
            var attr_content = '';
            if (label_content && label_content.length > 0){
                for (var i in label_content){
                    attr_content = `<div class="attribute">
                                        <span>${/(\w+)\s*=\s*["|\'].*?["|\']/g.exec(label_content[i])[1]}:</span>
                                        <span>${/\w+\s*=\s*(["|\'].*?["|\'])/g.exec(label_content[i])[1].replace(/"/g, '')}</span>
                                    </div>`;
                    $('#attr', parent.document).append(attr_content);
                }
            }
        },
        // 鼠标移除事件
        'mouseout': function (event) {
            event.stopPropagation();
            $(event.target).toggleClass('start-sel', parent.document);
            $(event.target).removeAttr('title', parent.document);
            $('#attr', parent.document).html('');
        }
    });
    // 鼠标点击事件
    $(this).bind({'click': function(event){
        // 列表第二次选择
        if ($('#multiple', parent.document).attr('disabled')){
            $(event.target).removeClass('start-sel').addClass('end-sel');
            $(this).unbind('click');
            $('*').unbind('mousemove').unbind('mouseout');
            var first = $('#select-input', parent.document).val();
            $('.show-element p', parent.document).remove();
            $('.select-view', parent.document).css('display', 'block');
            // 共有父类
            var result = common_element(first, $('#path', parent.document).text());
            console.log('result:', result);
            if (!result){
                // 隐藏窗口
                $('.select-view ', parent.document).css('display','none');
                $('.show-element', parent.document).css('display', 'none');
                // 取消边框样式
                $($('#path', parent.document).text()).removeClass('end-sel');
                // 取消显示
                $('#select-name').popover('hide');
                // 解除按钮禁用
                $('div.sidebar > button', parent.document).removeAttr('disabled');
                return false;
            }
            // 构造表单
            content = {'name': $('#select-name', parent.document).val(), 'input': result};
            selectViewForm();
            // 解除按钮禁用
            $('div.sidebar > button', parent.document).removeAttr('disabled');
            return false;
        // 非列表选择
        } else {
            // 阻止事件冒泡
            // event.stopPropagation();
            $(event.target).removeClass('start-sel').addClass('end-sel');
            // 解除事件
            $(this).unbind('click');
            $('*').unbind('mousemove').unbind('mouseout');
            // 清空数据
            $('#select-name', parent.document).val('');
            $('#select-input', parent.document).val('');
            // 构造弹出表单
            content = {'input':  $('#path', parent.document).text()};
            selectViewForm(content);
            // 启动中间弹窗
            $('.select-view', parent.document).css('display', 'block');
            // 绑定清除背景、隐藏窗口按钮
            $('body > div.select-view > div:nth-child(1) > button', parent.document).on('click', function(){
                // 隐藏窗口
                $('.select-view ', parent.document).css('display','none');
                $('.show-element', parent.document).css('display', 'none');
                // 取消边框样式
                $($('#path', parent.document).text()).removeClass('end-sel');
                // 取消显示
                $('#select-name').popover('hide');
            });
            // 解除按钮禁用
            $('div.sidebar > button', parent.document).removeAttr('disabled');

            // 阻止点击事件
            return false;
        }
    }
    });
}

// 构造弹出框表单
function selectViewForm(content) {
    content.name ? $('#select-name').val(content.name) : $('#select-name').val('');
    var sel_content = {};
    for (var i=0;i<$('#attr .attribute', parent.document).length;i++){
        sel_content[$('#attr .attribute', parent.document).eq(i).find('span').eq(0).text().replace(/: /g, '')] =
        $('#attr .attribute', parent.document).eq(i).find('span').eq(1).text();
    }
    $('#select-form', parent.document).html('<option>content</option>');
    $('#select-value', parent.document).html(sel_content['content']);
    content.input ? $('#select-input', parent.document).val(content.input) : $('#select-input', parent.document).val($('#path', parent.document).text());
    for (var i in sel_content){
        if (i !== 'content'){
            $('#select-form', parent.document).append('<option>' + i + '</option>');
        }
    }
    $('#select-form', parent.document).change(function(){
        $('#select-value', parent.document).html(sel_content[$(this).children('option:selected').val()]);
        $('#select-input', parent.document).val($('#path', parent.document).text());
    });
}

function common_element(first, second){
    /*
    1.同列表元素的dom层级一致
    2.同列表元素至少一层父元素不一致
    */
    var arr_1 = first.split(' ').map(val => val.split(':'))
    var arr_2 = second.split(' ').map(val => val.split(':'))
    // 同列表元素判断
    if (arr_1.length == arr_2.length){
        var global_element = [];
        $.each(arr_1, function(index, value){
            if (arr_1[index].toString() == arr_2[index].toString()){
                global_element.push(arr_1[index].join(':'));
            }
            else{
                if (arr_1[index][0] == arr_2[index][0]){
                    global_element.push(arr_1[index][0]);
                }
            }
        })
        var global_father = global_element.join(' ');
        if ($(first).is($(global_father)) && $(second).is($(global_father))){
            return global_father;
        } else{
            return false;
        }
    } else {
        return false;
    }
}