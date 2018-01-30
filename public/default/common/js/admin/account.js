// 请求注册接口
function callRegisterLogic() {
    // 检查表单数据
    var username = $('#username').val()
    if (Utils.isEmpty(username)) {
        $("em[for='email']").text('请输入邮箱')
        $('#username').focus()
        return
    } else if(!Utils.isEmail(username)) {
        $("em[for='email']").text('邮箱格式不对，请输入正确的邮箱')
        $('#username').focus()
        return
    } else {
        $("em[for='email']").text('')
    }

    var password = $('#nPwd').val()
    if (Utils.isEmpty(password)) {
        $("em[for='nPwd']").text('请输入密码')
        $('#nPwd').focus()
        return
    } else if(!Utils.isPassword(password))
    {
        $("em[for='nPwd']").text('密码必须由6-16个英文字母和数字的字符串组成。')
        $('#nPwd').focus();
        return
    } else {
        $("em[for='nPwd']").text('')
    }

    var rnPwd = $('#rnPwd').val()
    if(password !== rnPwd)
    {
        $("em[for='rnPwd']").text('您两次输入的新密码不一致。')
        return
    } else {
        $("em[for='rnPwd']").text('')
    }

    var name = $('#name').val()
    if(name.length < 2 || name.length > 32 || name.replace(/\s+/,'') == '')
    {
        $("em[for='name']").text('公司/个人名称必须为2-32字符。')
        $('#name').focus();
        return
    } else {
        $("em[for='name']").text('')
    }

    var tel = $('#tel').val()
    if(!(Utils.isTel(tel)))
    {
        $("em[for='tel']").text('联系电话有误，请输入正确的固定电话号或手机号。')
        $('#tel').focus();
        return
    } else {
        $("em[for='tel']").text('')
    }

    if(!$("input[type='checkbox']").is(':checked'))
    {
        $("em[for='checkbox']").text('您必须同意服务条款。')
        return
    } else {
        $("em[for='checkbox']").text('')
    }

    $.ajax({
        url: '/admin/register.html',
        type: 'post',
        data: {'username':username, 'password':password, 'name':name, 'tel':tel},
        dataType: 'json',
        beforeSend: function() {
            setLoading('正在注册中, 请稍候...')
            $("#btnRegister").attr('disabled', 'disabled')
        },
        complete: function() {
            hideLoading()
            $('#btnRegister').removeAttr('disabled')
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
$('#btnRegister').click(function () {
    // 请求api
    callRegisterLogic()
})

// 请求登录接口
function callLoginLogic() {
    // 检查表单数据
    var username = $('#username').val()
    if (Utils.isEmpty(username)) {
        $("em[for='email']").text('请输入邮箱')
        $('#username').focus()
        return
    } else if(!Utils.isEmail(username)) {
        $("em[for='email']").text('邮箱格式不对，请输入正确的邮箱')
        $('#username').focus()
        return
    } else {
        $("em[for='email']").text('')
    }

    var password = $('#password').val()
    if (Utils.isEmpty(password)) {
        $("em[for='Pwd']").text('请输入密码')
        $('#password').focus()
        return
    }else {
        $("em[for='Pwd']").text('')
    }

    $.ajax({
        url: '/admin/login.html',
        type: 'post',
        data: {'username':username, 'password':password},
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
$('#btnLogin').click(function () {
    // 请求api
    callLoginLogic()

})

// 请求登出接口
function callLogoutLogic() {
    $.ajax({
        url: '/admin/logout.html',
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

// 请求修改密码接口
function callChangePasswordLogic() {
    // 检查表单数据
    var password = $('#password').val()
    if (Utils.isEmpty(password)) {
        $("em[for='password']").text('请输入旧密码')
        $('#password').focus()
        return
    } else if(!Utils.isPassword(password))
    {
        $("em[for='password']").text('密码必须由6-16个英文字母和数字的字符串组成。')
        $('#password').focus();
        return
    } else {
        $("em[for='password']").text('')
    }

    var newPassword = $('#newPassword').val()
    if (Utils.isEmpty(newPassword)) {
        $("em[for='newPassword']").text('请输入新密码')
        $('#newPassword').focus()
        return
    } else if(!Utils.isPassword(newPassword))
    {
        $("em[for='newPassword']").text('密码必须由6-16个英文字母和数字的字符串组成。')
        $('#password').focus();
        return
    } else {
        $("em[for='newPassword']").text('')
    }

    var affirmNewPassword = $('#affirmNewPassword').val()
    if(newPassword !== affirmNewPassword)
    {
        $("em[for='affirmNewPassword']").text('您两次输入的新密码不一致。')
        return
    } else {
        $("em[for='affirmNewPassword']").text('')
    }

    $.ajax({
        url: '/admin/changePassword.html',
        type: 'post',
        data: {'password':password, 'newPassword':newPassword},
        dataType: 'json',
        beforeSend: function() {
            console.log('正在修改中')
            setLoading('正在修改中, 请稍候...')
            $("#btnChangePassword").attr('disabled', 'disabled')
        },
        complete: function() {
            hideLoading()
            $('#btnChangePassword').removeAttr('disabled')
        },
        success: function(response) {
            console.log('response1111111 ==>' ,JSON.stringify(response))
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
$('#btnChangePassword').click(function () {
    // 请求api
    callChangePasswordLogic()
})

// 请求发送重置密码邮箱接口
function callResetPasswordLogic() {
    // 检查表单数据
    var username = $('#username').val()
    if(!Utils.isEmail(username))
    {
        $("em[for='email']").text('邮箱格式不对，请输入正确的邮箱。')
        $('#username').focus();
        return
    } else {
        $("em[for='email']").text('')
    }

    $.ajax({
        url: '/admin/resetPassword.html',
        type: 'post',
        data: {'username':username},
        dataType: 'json',
        beforeSend: function() {
            setLoading('正在发送中, 请稍候...')
            $("#btnResetPassword").attr('disabled', 'disabled')
        },
        complete: function() {
            hideLoading()
            $('#btnResetPassword').removeAttr('disabled')
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
$('#btnResetPassword').click(function () {
    // 请求api
    callResetPasswordLogic()
})

// 请求重置密码接口
function callSetPasswordLogic() {
    // 检查表单数据
    var newPassword = $('#nPwd').val()
    if(!Utils.isPassword(newPassword))
    {
        $("em[for='nPwd']").text('密码必须由6-16个英文字母和数字的字符串组成。')
        $('#nPwd').focus();
        return
    } else {
        $("em[for='nPwd']").text('')
    }

    var affirmNewPassword = $('#rnPwd').val()
    if(newPassword !== affirmNewPassword)
    {
        $("em[for='rnPwd']").text('您两次输入的新密码不一致。')
        return
    } else {
        $("em[for='rnPwd']").text('')
    }

    var username = $('#username').val()
    var randomFlag = $('#randomFlag').val()
    $.ajax({
        url: '/admin/setPassword.html',
        type: 'post',
        data: {'newPassword':newPassword, 'username':username, 'randomFlag':randomFlag},
        dataType: 'json',
        beforeSend: function() {
            setLoading('正在重置中, 请稍候...')
            $("#btnSetPassword").attr('disabled', 'disabled')
        },
        complete: function() {
            hideLoading()
            $('#btnSetPassword').removeAttr('disabled')
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
$('#btnSetPassword').click(function () {
    // 请求api
    callSetPasswordLogic()
})

// 请求编辑用户资料接口
function callEditAccountLogic() {
    // 检查表单数据
    var name = $('#name').val()
    if(name.length < 2 || name.length > 32 || name.replace(/\s+/,'') == '')
    {
        $("em[for='name']").text('公司/个人名称必须为2-32字符。')
        $('#name').focus();
        return
    } else {
        $("em[for='name']").text('')
    }

    var username = $('#username').val()
    if (!Utils.isEmail(username))
    {
        $("em[for='username']").text('邮箱格式不对，请输入正确的邮箱。')
        $('#username').focus();
        return
    } else {
        $("em[for='username']").text('')
    }

    var tel = $('#tel').val()
    if (!Utils.isTel(tel))
    {
        $("em[for='tel']").text('联系电话有误，请输入正确的固定电话号或手机号。')
        $('#tel').focus();
        return
    } else {
        $("em[for='tel']").text('')
    }

    $.ajax({
        url: '/admin/index.html',
        type: 'post',
        data: {'username':username, 'name':name, 'tel':tel},
        dataType: 'json',
        beforeSend: function() {
            setLoading('正在保存中, 请稍候...')
            $("#btnEditAccount").attr('disabled', 'disabled')
        },
        complete: function() {
            hideLoading()
            $('#btnEditAccount').removeAttr('disabled')
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
$('#btnEditAccount').click(function () {
    // 请求api
    callEditAccountLogic()
})

function checkEditAccountForm(frm)
{

    $("#postUser").attr("disabled",true);
    setTimeout(function (){$("#postUser").attr("disabled",false);},5000);
    return true;
}

function auditAccount(status, target) {
    var username = $(target).attr('data')
    // , page = parseInt($('a', $('.active', $('#pages'))).html())

    $.ajax({
        url: '/management/accounts.html',
        type: 'post',
        data: {'status' : status, 'username' : username},
        dataType: 'json',
        beforeSend: function() {
            console.log('<==== Loading ====>')
            setLoading('正在审核中, 请稍候...')
            // $("#btnEditAccount").attr('disabled', 'disabled')
        },
        complete: function() {
            // hideLoading()
            // $('#btnEditAccount').removeAttr('disabled')
        },
        success: function(response) {
            console.log('<== success ==>')
            var callback = function () {
                if(response.state == 1 && response.data) {
                    //刷新当前页面
                    window.location.reload();
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




// 请求重置的密码页面接口
// function callSetPasswordView() {
//
//     $.ajax({
//         url: '/admin/index.html',
//         type: 'get',
//         data: {},
//         dataType: 'json',
//         beforeSend: function() {
//             setLoading('正在加载中, 请稍候...')
//             // $("#btnSetPassword").attr('disabled', 'disabled')
//         },
//         complete: function() {
//             hideLoading()
//             // $('#btnSetPassword').removeAttr('disabled')
//         },
//         success: function(response) {
//             var callback = function () {
//                 if(response.state == 1 && response.data) {
//                     if(!Utils.isEmpty(response.data.redirect)){
//                         window.location.href = response.data.redirect
//                     }
//                 } else {
//
//                 }
//             }
//             showMessage(response.message, callback)
//         },
//         error: function(xhr, ajaxOptions, thrownError) {
//             console.error(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText)
//             showMessage('抱歉, 请求服务器失败[ref:' + xhr.statusText + ']', 1)
//         }
//     })
// }



function confirmAlert(status, target, message) {
    showConfirm(message, function (isConfirm) {
        if (isConfirm) {
            auditApplication(status, target)
        }
    })
}


function auditApplication(status, target) {
    var id = $(target).attr('data_id')
    var name = $(target).attr('data_name')
    var username = $(target).attr('data')
    console.log('id =====>', id)
    console.log('name =====>', name)
    console.log('username =====>', username)



    $.ajax({
        url: '/management/applications.html',
        type: 'post',
        data: {'status' : status, 'id' : id, 'name' : name, 'username' : username},
        dataType: 'json',
        beforeSend: function() {
            console.log('<==== Loading ====>')
            setLoading('正在操作中, 请稍候...')
            // $("#btnEditAccount").attr('disabled', 'disabled')
        },
        complete: function() {
            // hideLoading()
            // $('#btnEditAccount').removeAttr('disabled')
        },
        success: function(response) {
            console.log('<== success ==>')
            var callback = function () {
                console.log('弹窗后回调')
                if(response.state == 1 && response.data) {
                    //刷新当前页面
                    window.location.reload();
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

// 账户列表状态下拉筛选
function changeAccounts(){
    var objS = document.getElementById("projectStatus");
    var status =$(objS).children('option:selected').val();//这就是selected的值

    window.location.replace("/management/accounts.html?status=" + status)
}

// 应用列表状态下拉筛选
function changeApplicationsStatus(){
    var objS = document.getElementById("projectStatus");
    var status =$(objS).children('option:selected').val();

    console.log('status==>' , status)
    window.location.replace("/management/applications.html?status=" + status)
}


// // 应用列表应用下拉筛选
// function changeApplicationsProducts(){
//     var objS = document.getElementById("projectType");
//     var products_id =$(objS).children('option:selected').val();
//
//     console.log('productsId==>' , products_id)
//     window.location.replace("/management/applications.html?products_id=" + products_id)
// }

