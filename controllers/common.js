'use strict'

var P = require('bluebird')
var Config = require('../config.js')
var Constant = Config['Constant'] || {}
var DataDisks = Config['DataDisks'] || {}
var Mailer = require('../lib/mailer.js')
var template = require('./lib/template.js')
var ApiUtil = require('../extension/api/lib/util.js')
var MyUtil = require('../lib/util.js')

var Lang = require('../lang/lang.js')

var XLSX = require('xlsx')

var Models = require('../models/models.js')

// 公开主页
exports.indexView = function (req, res, next) {
    var options = {
        // L: Lang.getFile(req.session.lang, 'index')
    }
    res.go('index', options)
}

// 微信签名
exports.signatureLogic = function (req, res, next) {
    var token = global.WEIXIN_TOKEN
    var signature = req.query.signature
    var timestamp = req.query.timestamp
    var echostr = req.query.echostr
    var nonce = req.query.nonce

    // console.log('signature>>' + signature)
    // console.log('timestamp>>' + timestamp)
    // console.log('echostr>>' + echostr)
    // console.log('nonce>>' + nonce)
    // signature>>910dee49fe13d557eaa1b36029f8c3dc14c23430
    // timestamp>>1493466656
    // echostr>>5050618831909158772
    // nonce>>1723731730

    var sha1 = require('sha1');
    var str = [token, timestamp, nonce].sort().join('');
    var scyptoStr = sha1(str);

    if(signature == scyptoStr){
        // 验证成功
        res.send(echostr)
    } else {
        // 验证失败
        res.send('WeChat authorized failure')
    }
}

exports.changeLanguage = function (req, res, next) {
    req.session = req.session || {}
    req.session.lang = req.query.lang
    // TODO 待处理
    exports.homeView(req, res, next)
}

// TODO 测试
exports.testView = function(req, res, next) {
    var version = ''
    return Models.initOptionDB(version).PfindByCondition({})
        .then(function (docs) {
            console.log('docs>>' + JSON.stringify(docs))
            res.go('test', {message: 'ok', data: docs})
        })
}