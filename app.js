'use strict';

require('console-stamp')(console, 'mm-dd HH:MM')
var Template = require('art-template')
var Express = require('express')
var App = module.exports = Express()
// var Config = mongoose.models.Config
var Path = require('path')
var Logger = require('morgan')
var BodyParser = require('body-parser')
var Favicon = require('serve-favicon')
var CookieParser = require('cookie-parser')()
var Timeout = require('connect-timeout')
var Compression = require('compression')()
var Session = require('express-session')
var RedisStore = require('connect-redis')(Session)
var Redis = require('redis')
var MD5 = require('blueimp-md5').md5
var P = require('bluebird')

var Config = require('./config.js')
var Constant = Config['Constant'] || {}
var DataDisks = Config['DataDisks'] || {}
var JSONPackage = require('./package.json')
var MyUtil = require("./lib/util.js")

process.umask(0)
process.env = process.env || {}
process.env.PORT = process.env.PORT || Constant['PORT']
process.env.NODE_ENV = process.env.NODE_ENV || 'development'
App.settings.env = process.env.NODE_ENV
console.info('线程开启的环境: ', App.settings.env)
require('./global.js')()
global.isAPP = true

// 获取安装状态
// function installStatus() {
//     // 获取硬件信息
//     var cpu_model = MyUtil.getCpu().model
//     var network_mac = MyUtil.getNetwork().mac
//     var network_ip = MyUtil.getNetwork().ip
//     // 组装
//     var property_data =  {
//         "b":
//         {
//             "1": cpu_model
//         },
//         "c":
//         {
//             "1": network_mac,
//             "2": network_ip
//         }
//     }
//     // 操控
//     return MyUtil.readJSONFile('property.json')
//         .then(function (data) {
//             if (data.hasOwnProperty('a')) {// 安装
//                 if (!(data['a'].hasOwnProperty('1')) || data['a']['1'] != MD5(global.ACCESS_KEY)) {
//                     // 抛出异常
//                     console.error('安装密钥不合法,请联系软件提供商!')
//                     return P.reject(false)
//                 } else {
//                     return MyUtil.writeFile('property.json', property_data)
//                         .then(function () {
//                             console.info('恭喜您已安装成功!')
//                             return P.resolve(true)
//                         })
//                         .catch(function (err) {
//                             // 抛出异常
//                             console.trace(err)
//                             console.error('安装密钥有问题,请联系软件提供商!')
//                             return P.reject(false)
//                         })
//                 }
//             } else {// 启动
//                 if (!(data.hasOwnProperty('b')) || !(data['b'].hasOwnProperty('1')) || data['b']['1'] != cpu_model || !(data.hasOwnProperty('c')) || !(data['c'].hasOwnProperty('1')) || data['c']['1'] != network_mac || !(data['c'].hasOwnProperty('2')) || data['c']['2'] != network_ip) {
//                     // 抛出异常
//                     console.error('启动密钥已破坏,请联系软件提供商!')
//                     return P.reject(false)
//                 } else {
//                     console.info('校验已通过,您可以继续使用软件!')
//                     return P.resolve(true)
//                 }
//             }
//         })
//         .catch(function (err) {
//             // 捕抓到异常并提示
//             console.trace(err)
//             console.error('密钥文件有问题,请联系软件提供商!')
//         })
// }

P.resolve()
    // .then(function () {
    //     return installStatus()
    // })
    .then(function (status) {
        // 捕抓到安装状态并退出
        // console.log('安装状态并退出')
        // if (!status) {
        //     console.log('安装状态并退出 return')
        //     return
        // }

        // console.log('安装状态并退出 DataServer')
        // var DataServer = require('./service/dataServer.js')
        var Authenticate = require('./service/oauth/authenticate.js')

        App.use(Favicon(__dirname + '/public/default/common/img/favicon.ico'));
        App.use(Logger('dev'))
        App.use(CookieParser)
        App.use(Express.static(Path.join(__dirname, 'public')))
        App.use(Timeout('60s'));
        var maxAge = global.IS_PRODUCTION ? 3600 * 24 * 7 : 0;
        for (var key in DataDisks) {
            var disks = DataDisks[key]
            for (var index in disks) {
                var disk = disks[index]
                App.use(disk, Express.static(disk, {maxAge: maxAge}))
            }
        }
        App.use('/common/css', Express.static(Path.join(__dirname, '/public/default/common/css/'), {maxAge: maxAge}))
        App.use('/common/fonts', Express.static(Path.join(__dirname, '/public/default/common/fonts/'), {maxAge: maxAge}))
        App.use('/common/img', Express.static(Path.join(__dirname, '/public/default/common/img/'), {maxAge: maxAge}))
        App.use('/common/data', Express.static(Path.join(__dirname, '/public/default/common/data/'), {maxAge: maxAge}))
        App.use('/common/js', Express.static(Path.join(__dirname, '/public/default/common/js/'), {maxAge: maxAge}))
        App.use('/target/css', Express.static(Path.join(__dirname, '/public/default/target/css/'), {maxAge: maxAge}))
        App.use('/target/js', Express.static(Path.join(__dirname, '/public/default/target/js/'), {maxAge: maxAge}))
        App.use(Compression)
        App.use(BodyParser.json());
        App.use(BodyParser.urlencoded({extended: false}))

        App.set('version', JSONPackage.version)
        App.set('views', Path.join(__dirname, 'views'))
        Template.config('base', Path.join(__dirname, 'views'))
        Template.config('extname', '.html')
        App.engine('.html', Template.__express)
        App.set('view engine', 'html')

        var redisClient = Redis.createClient(Constant['REDIS_PORT'] || 6379, Constant['REDIS_HOST'] || "127.0.0.1")
        App.use(Session({
            cookie: {maxAge: (1000 * 3600 * 24 * 30)},
            secret: 'mc.feebird.net',
            store: new RedisStore({client: redisClient}),
            resave: false,
            saveUninitialized: true
        }))

        require('./models/mongodb.js').appInit()

        require('./controllers/router.js')(App)
        require('./router-common.js')(App)

        // DataServer.appInit()

        // 开启一些定期任务
        require('./service/handler.js').appInit()

        // 认证组件初始化
        var config_oauth = require('./service/oauth/config.js')
        if (config_oauth.seedDB) { require('./service/oauth/seed.js'); }
        if (config_oauth.seedMongoDB) { require('./service/oauth/seed-mongo.js'); }
        require('./service/oauth')(App)

        var port = process.env.PORT
        App.listen(port)
        console.info('应用监听端口: ', port)

        process.on('uncaughtException', function (err) {
            console.trace('未捕获的异常: ', err)
        });
    })