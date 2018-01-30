// // 文件下载
// jQuery.download = function (url, method, option) {
//     jQuery('<form action="' + url + '" method="' + (method || 'post') + '">' +  // action请求路径及推送方法
//         '<input type="text" name="page" value="' + option.page + '"/>' + // 文件路径
//         '<input type="text" name="limit" value="' + option.limit + '"/>' + // 文件名称
//         '<input type="text" name="sort" value="' + option.sort + '"/>' + // 文件名称
//         '</form>')
//         .appendTo('body').submit().remove();
// }

// 请求导出接口
function callExportFileLogic() {
    // TODO 待处理 检查表单数据

    // $.download('/admin/data/export.html?page=0&limit=99999&sort={"time": -1}', 'get', {page: 0, limit: 99999, sort: '{"time": -1}'});

    window.location.href = '/admin/data/export.html?page=0&limit=99999&sort={"time": -1}&time=' + globalTime

    // $.ajax({
    //     url: '/admin/data/export.html?page=0&limit=99999&sort={"time": -1}',
    //     type: 'get',
    //     dataType: 'json',
    //     contentType: false, //不可缺
    //     processData: false, //不可缺
    //     beforeSend: function () {
    //         setLoading('正在导出中, 请稍候...')
    //         $("#btnExportFile").attr('disabled', 'disabled')
    //     },
    //     complete: function () {
    //         hideLoading()
    //         $('#btnExportFile').removeAttr('disabled')
    //         $("#fileData").after($("#fileData").clone().val(""));
    //         $("#fileData").remove();
    //     },
    //     success: function (response) {
    //         var callback = function () {
    //             if (response.state == 1 && response.data) {
    //                 // if (!Utils.isEmpty(response.data.redirect)) {
    //                 if (!Utils.isEmpty(response.data.version)) {
    //                     // window.location.href = response.data.redirect
    //                     $("em[for='version']").text('数据录入成功, 版本号为: ' + response.data.version)
    //                 }
    //             } else {
    //
    //             }
    //         }
    //         showMessage(response.message, callback)
    //     },
    //     error: function (xhr, ajaxOptions, thrownError) {
    //         console.error(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText)
    //         showMessage('抱歉, 请求服务器失败[ref:' + xhr.statusText + ']', 1)
    //     }
    // })
}
$('#btnExportFile').click(function () {
    // 请求api
    callExportFileLogic()

})