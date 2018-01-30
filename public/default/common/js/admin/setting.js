// 请求设置接口
function callSettingLogic() {
    // 检查表单数据
    var versionName = $('#versionName').val()
    if (versionName == '') {
        $("small[for='versionName']").text('请选择数据版本')
        $('#versionName').focus()
        return
    } else {
        $("small[for='versionName']").text('')
    }

    $.ajax({
        url: '/admin/setting.html',
        type: 'post',
        data: {'versionName': versionName},
        dataType: 'json',
        beforeSend: function () {
            setLoading('正在设置中, 请稍候...')
            $("#btnSetting").attr('disabled', 'disabled')
        },
        complete: function () {
            hideLoading()
            $('#btnSetting').removeAttr('disabled')
        },
        success: function (response) {
            var callback = function () {
                if (response.state == 1 && response.data) {
                    // if (!Utils.isEmpty(response.data.redirect)) {
                    if (!Utils.isEmpty(response.data.version)) {
                        // window.location.href = response.data.redirect
                        $("em[for='version']").text('基本设置成功')
                    }
                } else {

                }
            }
            showMessage(response.message, callback)
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.error(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText)
            showMessage('抱歉, 请求服务器失败[ref:' + xhr.statusText + ']', 1)
        }
    })
}
$('#btnSetting').click(function () {
    // 请求api
    callSettingLogic()

})