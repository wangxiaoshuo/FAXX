'use strict';

var fs = require('fs-extra')
var template = require('art-template')
var P = require('bluebird')
var _ = require('lodash')
var Path = require('path')

var MyUtil = require('../../lib/util.js')

var cache = {}

require('./templateHelper.js')

exports.init = function () {}

function getTmpl(isCache, defaultPath) {
    if (isCache) {
        if (typeof cache[defaultPath] !== 'undefined') {
            return cache[defaultPath]
        }
    }
    return (cache[defaultPath] = template.compile(fs.readFileSync(defaultPath, 'utf8')))
}

exports.render = function (path, options, next) {
    if ('function' == typeof options) {
        next = options, options = {};
    }
    var defaultPath = Path.join(options.views, options.host, path + '.html')
    var defaultLayout = Path.join(options.views, options.host, (options.layout || 'layout') + '.html')
    try {
        var tmpl = getTmpl(global.IS_PRODUCTION, defaultPath)
        var content = tmpl ? tmpl(options) : console.error('没有找到页面模板: ', path)
        options.content = content
        var layout = getTmpl(global.IS_PRODUCTION, defaultLayout)
        next(null, layout(options))
    } catch (err) {
        console.trace(err);
        next(err)
    }
}

exports.renderEmail = function (path, options) {
    options.layout = 'email/layout'
    options.views = Path.join(MyUtil.resolveRelative(__filename, '../../views'))
    return new P(function (resolve, reject, notify) {
        exports.render(path, options, function (err, html) {
            if (err) {
                reject(err)
            } else {
                resolve(html)
            }
        })
    })
}