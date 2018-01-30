function showMessage(content, callback) {
    layer.msg(content, {time: 2 * 1000}, callback);
}

function showConfirm(message, callback) {
    swal({
            title: "提示",
            text: message,
            showCancelButton: true,
            cancelButtonText: "取消",
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "确认"
        },
        callback);
}

// 设置并且显示loading
function setLoading(message) {
    $('#overlay').show()
    $('#loading').show()
    $('body').css('overflow', 'hidden')
    $('#loading-text').html(message || '正在加载中,请稍候...')
}

// 隐藏
function hideLoading() {
    $('#overlay').hide()
    $('#loading').hide()
    $('body').css('overflow', 'auto')
    $('#loading-text').html('正在加载中,请稍候...')
}

// 克隆对象的键值对
function cloneAll(obj){
    var obj2 = new Object();
    for(var p in obj) {
        var name = p//属性名称
        var value = obj[p]//属性对应的值
        obj2[name] = value
    }
    return obj2
}

// 判断两个对象的值是否相等
function isObjectValueEqual(a, b) {
    // Of course, we can do it use for in
    // Create arrays of property names
    var aProps = Object.getOwnPropertyNames(a)
    var bProps = Object.getOwnPropertyNames(b)

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
        return false
    }

    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i]

        // If values of same property are not equal,
        // objects are not equivalent
        if (a[propName] !== b[propName]) {
            return false
        }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true
}