/**
 * Created by karl on 16/10/12.
 */

$(document).ready(function () {

    $('.i-checks').iCheck({
        checkboxClass: 'icheckbox_square-blue',
        radioClass: 'iradio_square-blue'
    });

    var arrList = new Array();
    var tpdemands = $("#tpdemands");
    $('input').on('ifChecked', function(event){
        arrList.push($(this).val());
        var newarr = arrList.toString();
        tpdemands.val(newarr);
    });

    $('input').on('ifUnchecked', function(event){
        arrList.splice(jQuery.inArray($(this).val(),arrList),1);
        var newarr = arrList.toString();
        tpdemands.val(newarr);
    });
    $('#nextButton').on( 'click', function () {
        $('#confimForm').submit();
    });
    // var serviceName, servicePrice;
//        updateSelectedService();

    var platform_error = $("#platform_error");
    var category_error = $("#category_error");
    var terms_error = $("#terms_error");
    $("#confimForm").validate({
        rules: {
            name: {
                required: true,
                minlength: 2,
                maxlength: 20
            }
            ,description: {
                required: true,
                minlength: 10,
                maxlength: 500
            }
            ,redirect_uri: {
                required: true,
                url: true
            }
            ,platform: {
                required: true,
            }
            ,category: {
                required: true,
            }
            ,terms: {
                required: true,
            }
        },
        messages: {
            name: {
                required: "请输入应用名称",
                minlength: "最少输入2个字符",
                maxlength: "最多输入20个字符"
            }
            ,description: {
                required: "请输入应用简介",
                minlength: "最少输入10个字符",
                maxlength: "最多输入500个字符"
            }
            ,redirect_uri: {
                required: "请输入回调域名",
                url: "必须输入正确格式的网址"
            }
            ,platform : {
                required: "请选择应用平台",
                minlength: "请至少选择1项。"
            }
            ,category : {
                required: "请选择应用类型。",
                minlength: "请至少选择1项。"
            }
            ,terms : {
                required: "请确认您的应用符合上述规定后勾选此项",
                minlength: "请确认您的应用符合上述规定后勾选此项"
            }
        },
        errorPlacement: function (error, element) { //指定错误信息位置
            if(element.attr('name') === 'platform') {
                error.appendTo(platform_error);
            } else if( element.attr('name') === 'category') {
                error.appendTo(category_error);
            } else if( element.attr('id') === 'terms') {
                error.appendTo(terms_error);
            }
            // else if (element.is(':radio') || element.is(':checkbox')) { //如果是radio或checkbox
            //     var eid = element.attr('name'); //获取元素的name属性
            //     error.appendTo(category_error); //将错误信息添加当前元素的父结点后面
            // }
            else {
                error.insertAfter(element);
            }
        },
        submitHandler: function(form) {
            showConfirm('提交确认后，将开始您的应用接入工作', function (isConfirm) {
                if (isConfirm) {
                    if (form) {
                        form.submit();
                    }
                }
            })
        }
    });
});

// var keyList = new Array();
// var nameList = new Array();
// uploadFile();
// function uploadFile() {
//     $fub = $('#btnUpload');
//     if ($(".files li").length >= 3 ) {
//         return false;
//     }
//
//     var uploader = new qq.FineUploaderBasic({
//         button: $fub[0],
//         request: {
//             endpoint: '/console/app/uploadFile'
//         },
//         validation: {
//             allowedExtensions: ['jpeg', 'jpg', 'gif', 'png', 'bmp', 'txt', 'rar', 'zip', 'doc', 'docx', 'xlsx', 'xls', 'pdf']
//         },
//         maxConnections: 1,
//         callbacks: {
//             onSubmit: function(id, fileName) {
//                 // this.setParams({'key': tKey});
//             },
//             onUpload: function(id, fileName) {
//             },
//             onProgress: function(id, fileName, loaded, total) {
//             },
//             onError: function(event, id, reason ) {
//                 alert(reason);
//             },
//             onComplete: function(id, fileName, responseJSON) {
//                 if (responseJSON.success) {
//                     $(".filesList").show();
//                     var html="";
//                     html = "<li fKey='" + responseJSON.key + "' id='" + responseJSON.key + "' fName='" + responseJSON.name + "'>";
//                     html += responseJSON.name + ' <a href="javascript:void(0)" onclick="deleteFile(\'' + responseJSON.key + '\' ,  \'' + responseJSON.name + '\' );">删除</a></li>';
//                     $('.files').append(html);
//                     setfilekey(responseJSON.key , responseJSON.name);
//
//                 }
//             }
//         },
//         debug: true
//     });
// }
//
// function deleteFile(key, name) {
//     $('#' + key + '').remove();
//     keyList.splice(jQuery.inArray(key,keyList),1);
//     var newkey = keyList.toString();
//     $("#fileKey").val(newkey);
//     nameList.splice(jQuery.inArray(name,nameList),1);
//     var newname = nameList.toString();
//     $("#fileName").val(newname);
// }
//
// function  setfilekey(key, name) {
//     keyList.push(key);
//     nameList.push(name);
//     var newkey = keyList.toString();
//     var newname = nameList.toString();
//     $("#fileKey").val(newkey);
//     $("#fileName").val(newname);
// }

