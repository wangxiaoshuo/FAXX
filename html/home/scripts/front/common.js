/**
 * Created by cengceng on 16/9/25.
 */

// 设置选择器的状态
function setPickerStatus(target) {
    if(target) {
        target.find('.container, .popup').addClass('show')
        // $('body').css('overflow', 'hidden')
        $('body, html').css({
            'height': '100%',
            'overflow': 'hidden'
        })
    } else {
        if ($('.picker').find('.container, .popup').hasClass('show')) {
            $('.picker').find('.container, .popup').removeClass('show')
            // $('body').css('overflow', 'auto')
            $('body, html').css({
                'overflow': 'auto'
            })
        }
    }
}

// 文本输入框效果
$('input').blur(function() {
    if ($(this).val().length > 0) {
        $(this).parents('.text-field').addClass('ontop')
    } else {
        $(this).parents('.text-field').removeClass('ontop')
    }
})

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

// 消息弹出层
function showModal(content, position) {
    var style_text = ""
    position = arguments[1] ? arguments[1] : 2
    if (position == 1) { //顶部弹出
        style_text = "border:none; background: rgba(0,0,0,.7); color:#fff;  max-width:100%; top:0; position:fixed; left:0; right:0; border-radius:0;";
    }
    if (position == 2) { //页面中间弹出
        style_text = "border:none; background: rgba(0,0,0,.7); color:#fff;  max-width:90%; min-width:1rem; margin:0 auto; border-radius:.8rem;";
    }
    layer.open({
        style: style_text,
        type: 0,
        anim: 3,
        content: content,
        shade: false,
        time: 2
    })
}