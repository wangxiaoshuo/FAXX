function showModal(content, position) { //消息弹出层
    // var style_text = "";
    // position = arguments[1] ? arguments[1] : 2;
    // if (position == 1) { //顶部弹出
    //     style_text = "border:none; background: rgba(0,0,0,.7); color:#fff; max-width:100%; top:0; position:fixed; left:0; right:0; border-radius:0;";
    // }
    // if (position == 2) { //页面中间弹出
    //     style_text = "border:none; background: rgba(0,0,0,.7); color:#fff; max-width:90%; min-width:1rem; margin:0 auto; border-radius:.8rem;";
    // }
    // layer.open({
    //     style: style_text,
    //     type: 0,
    //     anim: 3,
    //     content: content,
    //     shade: false,
    //     time: 2 * 1000
    // })
    console.log('此方法已经弃置,请更换为showMessage')
}

function showMessage(content, callback) {
    layer.msg(content, {time: 1 * 1000}, callback);
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