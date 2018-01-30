/**
 * Created by karl on 2017/5/1.
 */

jQuery(document).ready(function ($) {
    $(function () {
        $('#job_code').keyup(function() {
            if($(this).val() == '') {
                $("#msg_job_code").text('请输入员工编号')
                return
            }
            $("#msg_job_code").text('')
        })

        // 请求绑定工号接口,然后提交绑定微信
        function callBind() {
            // 检查表单数据
            var job_code = $('#job_code').val()
            if (Utils.isEmpty(job_code)) {
                showMessage('抱歉, 工号必须填写[ref:job_code]')
                $('#job_code').focus()
                return
            }
            $("#msg_job_code").text('')

            var formData = {
                username: job_code,
                openId: openid,
                name: nickname
            }

            $.ajax({
                url: globalApiUrl + '/api/account/bind.html',
                contentType: 'application/x-www-form-urlencoded',
                type: 'post',
                data: {
                    data: JSON.stringify(formData)
                },
                dataType: 'json',
                beforeSend: function() {
                    setLoading('正在绑定中, 请稍候...')
                    $("#btnSubmit").attr('disabled', 'disabled')
                },
                complete: function() {
                    hideLoading()
                    $('#btnSubmit').removeAttr('disabled')
                },
                success: function(response) {
                    showMessage(response.message)
                    // 响应成功
                    if (response.state == 1) {
                        // 绑定工号后, 用户自动登录
                        callLoginLogic(job_code)
                    } else {
                        // TODO 正常响应, 但服务器返回错误时, 额外操作处理
                    }
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    showMessage('抱歉, 请求服务器失败[ref:' + xhr.statusText + ']')
                }
            })
        }
        
        $('#btnSubmit').click(function () {
            // 请求api
            callBind()
        })

    })
});