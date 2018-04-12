/**
 * Created by Administrator on 2017/12/6.
 */

// 全局js
$(document).ready(function (){
    // 显示/隐藏 form表单
    $('#mode').change(function (){
        if ($('#mode').val() == 'post'){
            $('#form').children('a').css('visibility', 'visible');
        } else {
            $('#form').children('a').css('visibility', 'hidden');
        }
    });
});

// 显示header表单
function selectHeader(){
    $('#form-table').css('display', 'none');
    $('#cookie-table').css('display', 'none');
    $('#header-table').css('display', 'inline');
    $('#header').addClass('active').siblings("li").removeClass('active');
}

// 显示cookie表单
function selectCookie(){
    $('#form-table').css('display', 'none');
    $('#header-table').css('display', 'none');
    $('#cookie-table').css('display', 'inline');
    $('#cookie').addClass('active').siblings("li").removeClass('active');
}

// 显示form表单
function selectForm(){
    $('#header-table').css('display', 'none');
    $('#cookie-table').css('display', 'none');
    $('#form-table').css('display', 'inline');
    $('#form').addClass('active').siblings("li").removeClass('active');
}

// header表格添加行
function addHeaderRow(){
    // 获取行数
    var tr_len = $('#table_header tbody').find("tr").length;
    // 生成新行
    var trhtml = '<tr id="header_' + (tr_len + 1) + '"><td><input type="text" class="form-control" placeholder="New key"></td><td><input type="text" class="form-control" placeholder="New Value"></td><!-- 删除参数 --><td><button type="button" class="btn btn-default" onclick="delHeaderRow(' + (tr_len + 1) + ')"><span class="glyphicon glyphicon-trash"></span></button></td></tr>';
    // 添加
    $('#table_header').append(trhtml);
}

// Cookie表格添加行
function addCookieRow(){
    // 获取行数
    var tr_len = $('#table_cookie tbody').find("tr").length;
    // 生成新行
    var trhtml = '<tr id="cookie_' + (tr_len + 1) + '"><td><input type="text" class="form-control" placeholder="New key"></td><td><input type="text" class="form-control" placeholder="New Value"></td><!-- 删除参数 --><td><button type="button" class="btn btn-default" onclick="delCookieRow(' + (tr_len + 1) + ')"><span class="glyphicon glyphicon-trash"></span></button></td></tr>';
    // 添加
    $('#table_cookie').append(trhtml);
}

// form表格添加行
function addFormRow(){
    // 获取行数
    var tr_len = $('#table_form tbody').find("tr").length;
    // 生成新行
    var trhtml = '<tr id="form_' + (tr_len + 1) + '"><td><input type="text" class="form-control" placeholder="New key"></td><td><input type="text" class="form-control" placeholder="New Value"></td><!-- 删除参数 --><td><button type="button" class="btn btn-default" onclick="delFormRow(' + (tr_len + 1) + ')"><span class="glyphicon glyphicon-trash"></span></button></td></tr>';
    // 添加
    $('#table_form').append(trhtml);
}

// 删除header表格行
function delHeaderRow(rowIndex){
    $('#table_header tbody #header_' + rowIndex).remove();
}

// 删除cookie表格行
function delCookieRow(rowIndex){
    $('#table_cookie tbody #cookie_' + rowIndex).remove();
}

// 删除form表格行
function delFormRow(rowIndex){
    $('#table_form tbody #form_' + rowIndex).remove();
}

// 验证url
function verifyURL() {
    // url
    var url = $('#url').val();
    var re = /(https?|ftp|file):\/\/[-A-Za-z0-9+&@#\/%?=~_|!:,.;]+[-A-Za-z0-9+&@#\/%=~_|]/;
    if (re.test(url)) {
        return true;
    } else {
        $('#url').css('border-color', '#F66495');
        $('#url_warn').css('display', 'block');
        // 样式事件
        $('#url').change(function () {
            $(this).css('border-color', '#FFF');
            $('#url_warn').css('display', 'none');
        });
        return false;
    }
}

// 获取数据
function get_data() {
    var data = {};
    // 配置名称
    if (!$('#conf_name').val()){
        $('#conf_name').css('border-color', '#F66495');
        $('#name_warn').css('display', 'block');
        $('#conf_name').change(function () {
            $(this).css('border-color', '#FFF');
            $('#name_warn').css('display', 'none');
        });
        return false;
    }else{
        if ($('#conf_name').val() === 'config'){
            $('#conf_name').css('border-color', '#F66495');
            $('#name_warn').html('配置名称不能为config').css('display', 'block');
            $('#conf_name').change(function () {
                $(this).css('border-color', '#FFF');
                $('#name_warn').css('display', 'none');
            });
            return false;
        }
        data['name'] = $('#conf_name').val();
    }
    // url
    if (!verifyURL()){
        return false;
    }else{
        data['url'] = $('#url').val();
    }
    // 请求方式
    data['method'] = $('#mode').val();
    // 代理ip
    if ($('#proxy').is(':checked')){
        data['proxy'] = 1;
    }else{
        data['proxy'] = 0;
    }
    // 动态加载JS
    if ($('#dynamic').is(':checked')){
        data['dynamic'] = 1;
    }else{
        data['dynamic'] = 0;
    }
    // header
    var header_arr = {};
    var head_warn = 0;
    var header_items = $('#table_header tbody tr');
    for (var i = 0; i < header_items.length; i++) {
        if (i == 0 && header_items.eq(i).find('input').eq(0).val() != '' && header_items.eq(i).find('input').eq(1).val() != ''){
            header_arr[header_items.eq(i).find('input').eq(0).val()] = header_items.eq(i).find('input').eq(1).val();
        }
        if (i > 0){
            if (header_items.eq(i).find('input').eq(0).val() == ''){
                header_items.eq(i).find('input').eq(0).css('border-color', '#F66495');
                head_warn = 1;
            }
            if (header_items.eq(i).find('input').eq(1).val() == ''){
                header_items.eq(i).find('input').eq(1).css('border-color', '#F66495');
                head_warn = 1;
            }
            if (head_warn == 1){
                // 警告框
                $('#head_warn').fadeIn(900);
                setTimeout(function (){
                    $('#head_warn').fadeOut(900);
                }, 2500);
                // 样式事件
                $("#table_header tbody tr input").change(function(){
                    $(this).css('border-color', '#FFF');
                });
                return false;
            // 不存在空值时
            } else {
                header_arr[header_items.eq(i).find('input').eq(0).val()] = header_items.eq(i).find('input').eq(1).val();
            }
        } else {
            data['header'] = '';
        }
        data['header'] = header_arr;
    }

    // cookie
    var cookie_arr = {};
    var cookie_warn = 0;
    var cookie_items = $('#table_cookie tbody tr');
    for (var i = 0; i < cookie_items.length; i++) {
        if (i == 0 && cookie_items.eq(i).find('input').eq(0).val() != '' && cookie_items.eq(i).find('input').eq(1).val() != ''){
            cookie_arr[cookie_items.eq(i).find('input').eq(0).val()] = cookie_items.eq(i).find('input').eq(1).val();
        }
        if (i > 0){
            if (cookie_items.eq(i).find('input').eq(0).val() == ''){
                cookie_items.eq(i).find('input').eq(0).css('border-color', '#F66495');
                cookie_warn = 1;
            }
            if (cookie_items.eq(i).find('input').eq(1).val() == ''){
                cookie_items.eq(i).find('input').eq(1).css('border-color', '#F66495');
                cookie_warn = 1;
            }
            if (cookie_warn == 1){
                // 警告框
                $('#cookie_warn').fadeIn(900);
                setTimeout(function (){
                    $('#cookie_warn').fadeOut(900);
                }, 2500);
                // 样式事件
                $("#table_cookie tbody tr input").change(function(){
                    $(this).css('border-color', '#FFF');
                });
                return false;
            // 不存在空值时
            } else {
                cookie_arr[cookie_items.eq(i).find('input').eq(0).val()] = cookie_items.eq(i).find('input').eq(1).val();
            }
        } else {
            data['cookie'] = '';
        }
        data['cookie'] = cookie_arr;
    }

    // form
    var form_arr = {};
    var form_warn = 0;
    var form_items = $('#table_form tbody tr');
    for (var i = 0; i < form_items.length; i++) {
        if (i == 0 && form_items.eq(i).find('input').eq(0).val() != '' && form_items.eq(i).find('input').eq(1).val() != ''){
            form_arr[form_items.eq(i).find('input').eq(0).val()] = form_items.eq(i).find('input').eq(1).val();
        }
        if (i > 0){
            if (form_items.eq(i).find('input').eq(0).val() == ''){
                form_items.eq(i).find('input').eq(0).css('border-color', '#F66495');
                form_warn = 1;
            }
            if (form_items.eq(i).find('input').eq(1).val() == ''){
                form_items.eq(i).find('input').eq(1).css('border-color', '#F66495');
                form_warn = 1;
            }
            if (form_warn == 1){
                // 警告框
                $('#form_warn').fadeIn(900);
                setTimeout(function (){
                    $('#form_warn').fadeOut(900);
                }, 2500);
                // 样式事件
                $("#table_form tbody tr input").change(function(){
                    $(this).css('border-color', '#FFF');
                });
            // 不存在空值时
            } else {
                form_arr[form_items.eq(i).find('input').eq(0).val()] = form_items.eq(i).find('input').eq(1).val();
            }
        } else {
            data['form'] = ''
        }
        data['form'] = form_arr
    }
    if (head_warn == 0 && form_warn == 0){
        // json格式
        // data = JSON.stringify(data);
        return data
    } else {
        return false
    }
}

// 保存配置表单
function saveConfigForm(){
    // 获取数据
    var data = get_data();
    if (data){
        $('#modal_name').text(data.name);
        $('#modal_method').text(data.method);
        $('#modal_url').text(data.url);
        $('#model_proxy').text(data.proxy);
        $('#model_dynamic').text(data.dynamic);
        $('#modal_header').text(JSON.stringify(data.header));
        $('#modal_cookie').text(JSON.stringify(data.cookie));
        $('#modal_form').text(JSON.stringify(data.form));
        $('#myModal').modal('show');
    }
}

// TODO 保存配置
function saveConfig(){
    var data = {};
    data['name'] = $('#modal_name').text();
    data['first_url'] = $('#modal_url').text();
    data['method'] = $('#modal_method').text();
    data['headers'] = $('#modal_header').text();
    data['forms'] = $('#modal_form').text();
    data['cookies'] = $('#modal_cookie').text();
    data['ip_proxy'] = $("#model_proxy").text();
    data['dynamic'] = $("#model_dynamic").text();
    data['created_at'] = parseInt(new Date().getTime() / 1000);
    data['updated_at'] = data['created_at'];
    return data;
    // ajax提交
    // getDataset(data);
}

// TODO 提交配置
function getDataset(data) {
    $.ajax({
        url: window.location.origin + '/config/detail/',
        method: 'post',
        dataType: 'json',
        async: true,
        data: data,
        success: function(response){
            // 隐藏模态框
            $('#myModal').modal('hide');
            if (response.status === 0){
                $('#myModalLabel').html('重复');
                $('#modal_model_body').html('该配置名称已存在, 请修改！');
                $('#modal_model').modal('show');
            }else{
                $('#myModalLabel').html('成功');
                $('#modal_model_body').html('该配置已保存');
                $('#modal_model').modal('show');
                public_conf = data;
                public_conf.id = response.id;
            }
        },
        error: function () {
            $('#myModalLabel').html('保存失败');
            $('#modal_model_body').html("原因未知.");
            $('#modal_model').modal('show');
        }
    })
}

// 发送请求
function sendReqData(){
    var data = get_data();
    var send = function(url, data) {
        //创建form表单
        var temp_form = document.createElement("form");
        temp_form.action = url;
        //如需打开新窗口，form的target属性要设置为'_blank'
        temp_form.target = "_self";
        temp_form.method = "post";
        temp_form.style.display = "none";
        //添加参数
        for (var i in data) {
            var opt = document.createElement("textarea");
            opt.name = i;
            opt.value = JSON.stringify(data[i]);
            temp_form.appendChild(opt);
        }
        document.body.appendChild(temp_form);
        //提交数据
        temp_form.submit();
    };
    if (data){
        url = window.location.origin + '/add/work';
        send(url, data);
    }else{
        return false;
    }
}
