'use strict';

var Multer = require('multer')
var Upload = Multer({dest: './upload/'})
var URL = require('url')
var _ = require('lodash')
var express = require("express")
var wechat = require("wechat-api")

var BodyParser = require('body-parser')

var Config = require('../config.js')
var PageMeta = Config['PageMeta'] || {}
var Constant = Config['Constant'] || {}
var IS_CONFUSION = Constant['IS_CONFUSION'] || false
var Template = require('./lib/template.js')
var WechatAuthHandler = require('../lib/security.js').wechatAuthHandler
var AccountAuthHandler = require('../lib/security.js').accountAuthHandler
var AdminRoleAuthHandler = require('../lib/security.js').adminRoleAuthHandler

var DEFAULT = /^open\.zhinengming\.com$/
var WUMEI = /^open\.zhinengming\.com$/

var Lang = require('../lang/lang.js')

module.exports = function (app) {
    requestHandler(app)

    // 路由设置
    homeRoutes(app)
    adminRoutes(app)
    commonRoutes(app)
}

function requestHandler(app) {
    app.use(function (req, res, next) {
        req.session = req.session || {}

        if (! (/(zh)|(en)/.test(req.session.lang))) {
            // 非法语言Session, 默认为 中文
            req.session.lang = 'zh';
        }
        req.session.lang || getAcceptLanguage(req)

        var host = req.headers.host
        if (DEFAULT.exec(host)) {
            req.session.host = 'default'
            // TODO 待处理 根据网址默认语言?
            // req.session.lang = 'zh'
        } else if (WUMEI.exec(host)) {
            req.session.host = 'wumei'
        } else {
            req.session.host = 'default'
        }

        console.log('req.session.host:' + req.session.host + '; req.session.lang:' + req.session.lang)
        res.set({
            'strict-transport-security': 'max-age=31536000; includeSubDomains',
            'x-content-type-options': 'nosniff',
            'x-frame-options': 'SAMEORIGIN',
            'x-xss-protection': '1; mode=block'
        })
        res.go = function (view, options) {
            options = options || {}
            var o = {views: app.get('views'), APPVersion: app.get("version"), env: app.settings.env, Lang: Lang.getFile(req.session.lang, 'layout')}
            _.extend(options, o)
            options.account_id = req.session ? req.session.account_id : ''
            options.city = req.session ? req.session.city : ''
            options.username = req.session ? req.session.username : ''
            options.name = req.session ? req.session.name : ''
            options.role = req.session ? req.session.role : 0
            var _meta = PageMeta[req.session.lang]
            options.meta = _meta[view] || _meta['common']
            options.is_confusion = IS_CONFUSION
            options.host = req.session.host
            options.lang = req.session.lang
            options.time = new Date().getTime()
            // 此代码板块兼容内外网切换接口使用。
            var host = req.headers.host
            var apiUrl = req.protocol + "://" + host
            var imageUrl = req.protocol + "://" + host
            // 局域网开发
            if (host.indexOf('localhost') != -1 || host.indexOf('127.0.0.1') != -1 || host.indexOf('192.168.1.100') != -1) {
                // 解决花生壳Nginx访问过慢的问题, 把局域网访问速度提升
                // apiUrl = 'http://192.168.1.100:1212'
                // imageUrl = 'http://192.168.1.100:1212'
                // apiUrl = apiUrl + '2'
                apiUrl = Constant['API_URL_LAN']
                imageUrl = Constant['APP_URL_LAN']// 注意: 不支持项目访问的路径, 需要改为Nginx映射端口
            }
            // 广域网开发
            if (host.indexOf('feebird.net') != -1 || host.indexOf('1g9f.com') != -1 || host.indexOf('119.23.28.61') != -1) {
                apiUrl = Constant['API_URL_WAN']
                imageUrl = Constant['APP_URL_WAN']// 注意: 不支持项目访问的路径, 需要改为Nginx映射端口
            }
            options.api_url = apiUrl
            options.image_url = imageUrl
            res.format({
                html: function () {
                    if (req.user && options) options.user = req.user
                    Template.render(view, options, function (err, data) {
                        if (err) {
                            res.send(err.message)
                            console.trace(err)
                        } else {
                            res.send(data)
                        }
                    })
                },
                json: function (view, options) {
                    res.jsonp(options)
                }
            })
        }
        res.err = function (err) {
            console.trace(err)
            // this.go('err', {err: 1, msg: err.message || err})
            res.go('error', {message: err.message || err})
        }
        res.warn = function (msg) {
            console.warn(new Date, msg)
            // this.go('err', {err: 1, msg: msg})
            res.go('error', {message: msg})
        }

        req.isAjax = (req.header('x-requested-with') === "XMLHttpRequest")
        next()
    })
}

function homeRoutes(app) {
    var home = require('./home.js')

    // TODO 待处理
    app.get('/home/bind.html', WechatAuthHandler, home.bindView)
    app.post('/home/login.html', home.loginLogic)
    app.post('/home/logout.html', AccountAuthHandler, home.logoutLogic)


    app.get('/home/selector.html', WechatAuthHandler, AccountAuthHandler, home.selectorView)
    app.get('/home/design.html', WechatAuthHandler, AccountAuthHandler, home.designView)
    app.get('/home/pdesign.html', WechatAuthHandler, AccountAuthHandler, home.pdesignView)
    app.get('/home/record.html', WechatAuthHandler, AccountAuthHandler, home.recordView)
    app.get("/home/pselector.html",WechatAuthHandler,AccountAuthHandler,home.pushMessage)
}

function adminRoutes(app) {
    var admin = require('./admin.js')

    app.get('/admin/login.html', admin.loginView)
    app.post('/admin/login.html', admin.loginLogic)
    app.post('/admin/logout.html', admin.logoutLogic)

    app.get('/admin/index.html', AdminRoleAuthHandler, admin.indexView)
    app.get('/admin/info.html', AdminRoleAuthHandler, admin.infoView)
    app.get('/admin/account/list.html', AdminRoleAuthHandler, admin.accountListView)
    app.get('/admin/account/edit.html', AdminRoleAuthHandler, admin.accountEditView)
    app.get('/admin/setting.html', AdminRoleAuthHandler, admin.settingView)
    app.post('/admin/setting.html', AdminRoleAuthHandler, admin.settingLogic)
    app.get('/admin/data.html', AdminRoleAuthHandler, admin.dataView)
    app.post('/admin/data/upload.html', AdminRoleAuthHandler, Upload.array('upload_file'), admin.dataUploadLogic)
    app.get('/admin/data/export.html', AdminRoleAuthHandler, admin.dataExportLogic)
    app.get('/admin/record/list.html', AdminRoleAuthHandler, admin.recordListView)
    app.get('/admin/record/edit.html', AdminRoleAuthHandler, admin.recordEditView)
}

function commonRoutes(app) {
    var common = require('./common.js')
    // 主页显示
    app.get('/index.html', common.indexView)
    app.get('/', common.indexView)

    // 微信签名
    app.get('/signature.html', common.signatureLogic)

    // 切换语言
    app.get('/changeLang.html', common.changeLanguage)

    // TODO 待处理
    app.get('/test.html', common.testView)
}

function getAcceptLanguage(req) {
    var accepts = req.headers['accept-language'] || ''
    var zhIndex = accepts.indexOf('zh')
    var enIndex = accepts.indexOf('en')
    var lang = 'en'

    // 接受“en”和“zh型”, 返回第一个
    if (enIndex > -1 && zhIndex > -1) {
        lang = (enIndex < zhIndex) ? 'en' : 'zh'
    } else if (enIndex > -1) {
        lang = 'en'
    } else if (zhIndex > -1) {
        lang = 'zh'
    } else {
        lang = 'en'
    }
    req.session = req.session || {}
    req.session.lang = lang
}