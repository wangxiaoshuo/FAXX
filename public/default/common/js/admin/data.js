// 请求上传接口
function callUploadFileLogic() {
    // 检查表单数据
    $("em[for='version']").text('')
    var dataType = $("#dataType").val()
    if (Utils.isEmpty(dataType)) {
        $("em[for='dataType']").text('请选择录入数据的类型')
        $('input[name=dataType]').focus()
        return
    } else {
        $("em[for='dataType']").text('')
    }
    var inputType = $('input[name=inputType]:checked').val()
    if (Utils.isEmpty(inputType)) {
        $("em[for='inputType']").text('请选择录入方式的类型')
        $('input[name=inputType]').focus()
        return
    } else {
        $("em[for='inputType']").text('')
    }
    var files = $("#fileData")[0].files
    if (files.length <= 0) {
        $("em[for='file']").text('请选择需要导入的文件')
        $('#fileData').focus()
        return
    } else {
        $("em[for='file']").text('')
    }
    // // 上次修改时间
    // console.log("文件上次修改时间" + files[0].lastModifiedDate)
    // // 名称
    // console.log("文件名称" + files[0].name)
    // // 大小（字节）
    // console.log("文件大小" + files[0].size)
    // // 类型
    // console.log("文件类型" + files[0].type)
    // 创建FormData对象
    var data = new FormData()
    // 为FormData对象添加数据
    $.each(files, function (i, file) {
        data.append('upload_file', file)
    })
    data.append('dataType', dataType)
    data.append('inputType', inputType)

    $.ajax({
        url: '/admin/data/upload.html',
        type: 'post',
        data: data,
        dataType: 'json',
        contentType: false, //不可缺
        processData: false, //不可缺
        beforeSend: function () {
            setLoading('正在上传中, 请稍候...')
            $("#btnUploadFile").attr('disabled', 'disabled')
        },
        complete: function () {
            hideLoading()
            $('#btnUploadFile').removeAttr('disabled')
            $("#fileData").after($("#fileData").clone().val(""));
            $("#fileData").remove();
        },
        success: function (response) {
            var callback = function () {
                if (response.state == 1 && response.data) {
                    // if (!Utils.isEmpty(response.data.redirect)) {
                    if (!Utils.isEmpty(response.data.version)) {
                        // window.location.href = response.data.redirect
                        $("em[for='version']").text('数据录入成功, 版本号为: ' + response.data.version)
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
$('#btnUploadFile').click(function () {
    // 请求api
    callUploadFileLogic()

})