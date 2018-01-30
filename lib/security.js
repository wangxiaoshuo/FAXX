'use strict';

var mongoose = require('mongoose')
var Account = mongoose.models.account

var _ = require('lodash')
var WechatOauth = require('wechat-oauth')
var _Home = require('../controllers/home.js')

// 仅限局域网IP访问核心
var LOCAL_NETWORK_LIST = ['192.168.1', '192.168.2', '192.168.3', '127.0.0', '47.88.158', '172.18.77'];// TODO 三层交换机IP（在没有IB交换机时必须配置为当前局域网的IP）、IB交换机IP、本机IP
exports.localAreaNetwork = function (req, res, next) {
    console.info('当前主机: ' + req.hostname)
    var ip_net = req.hostname.substring(0, req.hostname.lastIndexOf('.'))
    if (LOCAL_NETWORK_LIST.indexOf(ip_net) > -1) {
        next()
    } else {
        next(new Error('接收到一个不是信任主机的请求: ' + req.hostname))
    }
}

exports.wechatAuthHandler = function (req, res, next) {
    var options = {}

    var wechatOauth = new WechatOauth(global.WEIXIN_APPID, global.WEIXIN_APPSECRET)
    var code = req.query.code
    // console.log('code:', code)
    // 未登录状态并且不带任何认证的连接code, 都需要重定向微信授权登录连接
    if (!code && (!req.session || !req.session.username || req.session.role == undefined)) {
        return res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + global.WEIXIN_APPID + '&redirect_uri=http://tieta.1g9f.com' + req.url + '&response_type=code&scope=snsapi_userinfo&state=STATE&connect_redirect=1#wechat_redirect')
    }
    wechatOauth.getAccessToken(code, function (err, accessToken) {
        // console.trace('err:', err)
        // console.log('result:', accessToken)
        if (err || !accessToken || !accessToken.data) {
            // 提示errcode":40163,"errmsg":"code been used。说明code被使用过一次了，官方文档说的很清楚，code只能用一次
            return next()
        }
        var openid = accessToken.data.openid
        // console.log('openid:', openid)
        _.extend(options, {openid: openid})
        wechatOauth.getUser(openid, function (err, userInfo) {
            if (err || !userInfo) {
                // 传参到页面提交绑定和登录
                return res.go('home/bind', options)
            }
            // console.log('userInfo:', userInfo)
            _.extend(options, userInfo)
            Account.findOne({openId: openid}, function (err, doc) {
                // console.log('url>>' + req.url)
                if (err || !doc || req.url.indexOf('home/bind') != -1) {
                    // 传参到页面提交绑定和登录
                    // console.log('options:', options)
                    return res.go('home/bind', options)
                } else if (req.url.indexOf('home/bind') == -1 && (!req.session || !req.session.username || req.session.role == undefined)) {
                    // 非绑定工号的页面并且未登录已绑定微信的用户, 需要执行自动登录逻辑。
                    req.body.autoLoginForAccount = doc
                    req.body.autoLoginForRedirectUrl = req.url
                    req.body.autoLoginForOptions = req.options
                    return _Home.loginLogic(req, res, next)
                }
                next()
            })
        })
    })
}

exports.accountAuthHandler = function (req, res, next) {
    console.info('会话信息: ' + JSON.stringify(req.session))
    if (!req.session || !req.session.username || req.session.role == undefined) {
        var loginUrl = '/home/bind.html'
        if (req.isAjax) {
            res.json({
                redirect: loginUrl,
                success: false,
                err: 'Unauthorized'
            })
        } else {
            res.redirect(loginUrl)
        }
        return
    }
    next()
}

// locater: 1,// 选址人员
// selecter: 2,// 选型人员
// designer: 3,// 设计人员
// manager: 10// 管理员
exports.adminRoleAuthHandler = function (req, res, next) {
    if (!req.session.role || req.session.role < global.ACCOUNT_ROLES.manager) {
        var message = {message: '您的权限不足 Ref: ' + req.session.role}
        if (req.isAjax) {
            res.send({state: -1, message: message})
        } else {
            var loginUrl = '/admin/login.html'
            res.redirect(loginUrl)
        }
        return
    }
    next()
}