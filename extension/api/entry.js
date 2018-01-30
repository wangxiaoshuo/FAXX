'use strict';

require('console-stamp')(console, 'mm-dd HH:MM')
var Http = require('http')
Http.globalAgent.maxSockets = Infinity
Http.globalAgent.keepAlive = true
Http.globalAgent.options.keepAlive = true
var Https = require('https')
Https.globalAgent.maxSockets = Infinity
Https.globalAgent.keepAlive = true
Https.globalAgent.options.keepAlive = true
var Express = require('express')
var App = Express()
var Compression = require('compression')
var Logger = require('morgan')
var Timeout = require('connect-timeout')
var BodyParser = require('body-parser')
var MD5 = require('blueimp-md5').md5
var P = require('bluebird')

var Mailer = require('../../lib/mailer.js')
var Config = require('../../config.js')
var Constant = Config['Constant'] || {}
var DataDisks = Config['DataDisks'] || {}
var Entry = Config['Entry'] || {}
var MyUtil = require("../../lib/util.js")

process.umask(0)
process.env = process.env || {}
process.env.PORT = process.env.PORT || Entry['PORT']
process.env.NODE_ENV = process.env.NODE_ENV || 'development'
App.settings.env = process.env.NODE_ENV
require('../../global.js')()
global.isAPI = true

// 获取安装状态
function installStatus() {
    // 获取硬件信息
    var cpu_model = MyUtil.getCpu().model
    var network_mac = MyUtil.getNetwork().mac
    var network_ip = MyUtil.getNetwork().ip
    // 组装
    var property_data =  {
        "b":
        {
            "1": cpu_model
        },
        "c":
        {
            "1": network_mac,
            "2": network_ip
        }
    }
    // 操控
    return MyUtil.readJSONFile('property.json')
        .then(function (data) {
            if (data.hasOwnProperty('a')) {// 安装
                if (!(data['a'].hasOwnProperty('1')) || data['a']['1'] != MD5(global.ACCESS_KEY)) {
                    // 抛出异常
                    console.error('安装密钥不合法,请联系软件提供商!')
                    return P.reject(false)
                } else {
                    return MyUtil.writeFile('property.json', property_data)
                        .then(function () {
                            console.info('恭喜您已安装成功!')
                            return P.resolve(true)
                        })
                        .catch(function (err) {
                            // 抛出异常
                            console.trace(err)
                            console.error('安装密钥有问题,请联系软件提供商!')
                            return P.reject(false)
                        })
                }
            } else {// 启动
                if (!(data.hasOwnProperty('b')) || !(data['b'].hasOwnProperty('1')) || data['b']['1'] != cpu_model || !(data.hasOwnProperty('c')) || !(data['c'].hasOwnProperty('1')) || data['c']['1'] != network_mac || !(data['c'].hasOwnProperty('2')) || data['c']['2'] != network_ip) {
                    // 抛出异常
                    console.error('启动密钥已破坏,请联系软件提供商!')
                    return P.reject(false)
                } else {
                    console.info('校验已通过,您可以继续使用软件!')
                    return P.resolve(true)
                }
            }
        })
        .catch(function (err) {
            // 捕抓到异常并提示
            console.trace(err)
            console.error('密钥文件有问题,请联系软件提供商!')
        })
}

P.resolve()
    .then(function () {
        return installStatus()
    })
    .then(function (status) {
        // 捕抓到安装状态并退出
        if (!status) {
            return
        }
        //设置跨域访问
        App.all('*', function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "X-Requested-With");
            res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
            res.header("X-Powered-By",' 3.2.1')
            res.header("Content-Type", "application/json;charset=utf-8");
            next();
        })

        App.use(Compression())
        App.use(BodyParser.json())
        App.use(BodyParser.urlencoded({extended: false}))
        App.use(Logger('dev'))
        App.use(Timeout('600s'))// 请求Api表面上是(十)分钟超时的,但实际上是五分钟超时,因为需要看备用Api服务器个数。
        var maxAge = global.IS_PRODUCTION ? 3600 * 24 * 7 : 0;
        for (var key in DataDisks) {
            var disks = DataDisks[key]
            for (var index in disks) {
                var disk = disks[index]
                App.use(disk, Express.static(disk, {maxAge: maxAge}))
            }
        }
        
        require('../../models/mongodb.js').entryInit()

        require('./router.js').entry(App)
        require('../../router-common.js')(App)

        // 开启一些定期任务
        require('../../service/handler.js').entryInit()

        require('../../lib/memcached.js').connectMemcached()
            .then(function () {
                var port = process.env.PORT
                App.listen(port)
                console.info('代理监听端口: ', port)
            }).catch(function (err) {
                console.error('[entry] Memcached 连接错误: ', err)
                if(global.IS_PRODUCTION) {
                    Mailer.send({
                        to: global.ADMIN_EMAIL,
                        subject: 'Memcached 连接错误',
                        html: 'Memcached 连接错误!'
                    }).then(function (err) {
                        process.exit(1)
                    }).catch(function (err) {
                        console.error('[entry] 邮件错误: ', err)
                        process.exit(1)
                    })
                }
            })

        process.on('uncaughtException', function (err) {
            console.trace('未捕获的异常', err)
        })
    })