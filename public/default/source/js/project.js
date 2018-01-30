/**
 * Created by karl on 16/10/12.
 */

var productId = '';
var productIdentifier = '';
var productName = '';

function alertMsg(msg) {
    swal({
        title: "提示",
        text: msg,
        showCancelButton: false,
        cancelButtonText: "取消",
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "确认"
    });
}

function nextStep() {
    if (productId === '' || productId === undefined || productId === null) {
        alertMsg('请选择产品类型');
        return false;
    }
    window.location.href = "/management/step2.html?productId=" + productId + "&productIdentifier=" + productIdentifier + "&productName=" + productName + "&target_data=step2";
}

$(document)
    .on('click', 'div[id^="product-"]', function (e) {
        var dom = e.currentTarget;
        // 修改界面样式
        $('div[id^="product-"]').removeClass("choose");
        $(dom).addClass("choose");

        // 读取当前数据
        productId = $(dom).find('#product_id').val();
        productIdentifier = $(dom).find('#product_identifier').val();
        productName = $(dom).find('#product_name').val();

        // 根据数据改变界面
        var $testName = $('#testName');
        var $nextButton = $('#nextButton');
        if (productName === '' || productName === undefined || productName === null) {
            $testName.text('您尚未选择产品类型');
            $nextButton.attr('disabled', 'true');
            return true;
        }
        $nextButton.removeAttr('disabled');
        $testName.text(productName);
    });
