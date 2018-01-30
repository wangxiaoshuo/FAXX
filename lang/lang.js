'use strict';
var Path = require('path')
var ValidLanguages = ['en', 'zh']
var Is_js = require('is_js')

/**
 * 获取语言
 * @param lang 从 req.session.lang 读取
 * @param path 子目录在 i18n/{{lang}}, 如: account/account
 * @param key 读取指定键值对
 */
exports.get = function (lang, path, key) {
    var json = exports.getFile(lang, path)
    var ret = json[key]
    if (Is_js.undefined(ret)) {
        console.error('没有获取到所指定的语言包: ', lang, path, key)
        return {message: '未知的键值对'}
    }
    return ret
}

exports.getFile = function (lang, path) {
    var valid_lang = 'zh'
    if (ValidLanguages.indexOf(lang) !== -1) {
        valid_lang = lang
    }

    try {
        return require('./' + Path.join(valid_lang, path))
    } catch (err) {
        console.error(err, lang, path)
        return {message: '获取语言包时发生异常'}
    }
}