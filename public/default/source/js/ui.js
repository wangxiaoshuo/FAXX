/**
 * Created by karl on 2017/5/1.
 */

jQuery(document).ready(function ($) {
    // 文本输入框效果
    $('input').blur(function() {
        if ($(this).val().length > 0) {
            $(this).parents('.text-field').addClass('ontop')
        } else {
            $(this).parents('.text-field').removeClass('ontop')
        }
    })
});