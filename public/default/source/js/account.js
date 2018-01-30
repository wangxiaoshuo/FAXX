// 请求登录接口
function callLoginLogic(username) {
    // 检查表单数据
    var username = username || 'J1424'
    var password = 'jsptpd123'

    $.ajax({
        url: '/home/login.html',
        type: 'post',
        data: {
            username: username,
            password: password
        },
        dataType: 'json',
        beforeSend: function() {
            setLoading('正在登录中, 请稍候...')
            $("#btnLogin").attr('disabled', 'disabled')
        },
        complete: function() {
            hideLoading()
            $('#btnLogin').removeAttr('disabled')
        },
        success: function(response) {
            var callback = function () {
                if(response.state == 1 && response.data) {
                    if(!Utils.isEmpty(response.data.redirect)){
                        // window.location.href = response.data.redirect
                        window.location.replace(response.data.redirect)
                    }
                } else {

                }
            }
            showMessage(response.message, callback)
        },
        error: function(xhr, ajaxOptions, thrownError) {
            console.error(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText)
            showMessage('抱歉, 请求服务器失败[ref:' + xhr.statusText + ']', 1)
        }
    })
}
$('#btnLogin').click(function () {
    // 请求api
    callLoginLogic()

})

// 请求登出接口
function callLogoutLogic() {
    $.ajax({
        url: '/home/logout.html',
        type: 'post',
        data: {},
        dataType: 'json',
        beforeSend: function() {
            setLoading('正在登出中, 请稍候...')
            $("#btnLogout").attr('disabled', 'disabled')
        },
        complete: function() {
            hideLoading()
            $('#btnLogout').removeAttr('disabled')
        },
        success: function(response) {
            var callback = function () {
                if(response.state == 1 && response.data) {
                    if(!Utils.isEmpty(response.data.redirect)){
                        window.location.href = response.data.redirect
                    }
                } else {

                }
            }
            showMessage(response.message, callback)
        },
        error: function(xhr, ajaxOptions, thrownError) {
            console.error(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText)
            showMessage('抱歉, 请求服务器失败[ref:' + xhr.statusText + ']', 1)
        }
    })
}
$('#btnLogout').click(function () {
    // 请求api
    callLogoutLogic()
})