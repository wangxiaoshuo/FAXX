'use strict';

var ApiUtil = require('./lib/util.js')

var localAreaNetwork = require('../../lib/security.js').localAreaNetwork

exports.api = function (app) {
    // 要求只能内网才能调用此API
    app.use(localAreaNetwork)

    var api = require('./api.js')

    app.use(function (req, res, next) {
        req.on('close', function () {
            if (req.clearTimeout)req.clearTimeout()
            req.timedout = true
        })
        next()
    })

    // 接口连接路由定义, 全部都是POST请求
    app.post('/api/account/:action.html', api.accountLogic)
    app.post('/api/record/:action.html', api.recordLogic)
    app.post('/api/schema/:action.html', api.schemaLogic)
    app.post('/api/form/:action.html', api.formLogic)
}

exports.entry = function (app) {
    var Authenticate = require('../../service/oauth/authenticate.js')
    // 认证组件初始化
    var Config_Oauth = require('../../service/oauth/config.js')
    if (Config_Oauth.seedDB) { require('../../service/oauth/seed.js'); }
    if (Config_Oauth.seedMongoDB) { require('../../service/oauth/seed-mongo.js'); }
    require('../../service/oauth')(app)

    var Multiparty = require('multiparty')
    var BodyParser = require('body-parser')
    var _ = require('lodash')
    var P = require('bluebird')
    var FS = require('fs')
    var Urllib = require('urllib')

    var Config = require('../../config.js')
    var Api = Config['Api'] || {}
    var Entry = Config['Entry'] || {}
    var Constant = Config['Constant'] || {}
    var IS_CONFUSION = Constant['IS_CONFUSION'] || false
    var Memcached = require('../../lib/memcached.js')
    var Download = require('../../lib/download.js')
    var Cache = require('../../lib/cache.js')
    var MyUtil = require('../../lib/util.js')
    var ApiUtil = require('./lib/util.js')

    var CONTENT_TYPE_MULTIPART = /^multipart\/(?:form-data|related)(?:;|$)/i
    var CONTENT_TYPE_JSON = 'application/json'
    var CONTENT_TYPE_URLENCODED = 'application/x-www-form-urlencoded'
    var maxFieldsSize = 2 * 1024 * 1024// 内存大小
    var maxFields = 500
    var maxFilesSize = 20 * 1024 * 1024// 文件字节大小限制，超出会报错err

    var API_SERVER_LIST = Api['SERVER_LIST']
    var server = MyUtil.cycleInArray(API_SERVER_LIST)

    function formHandler(req, res, next) {
        var contentType = req.headers['content-type']
        var err = {}
        var errorCount = 0
        if (!contentType) {
            err = new Error()
            err.state = global.API_RESPONSE_CODE.failed
            err.message = '缺少HTTP请求头的类型（content-type）'
            return res.send(err)
        }

        if (CONTENT_TYPE_MULTIPART.exec(contentType)) {
            var form = new Multiparty.Form({maxFieldsSize: maxFieldsSize, maxFields: maxFields, maxFilesSize: maxFilesSize})
            var promises = []
            req.body = req.body || {}
            req.files = []
            req.error = null
            req.rejected_by_status = false

            form.on('error', function (err) {
                next(err)
            });
            form.on('field', function (name, value) {
                if (_.isArray(req.body[name])) {
                    req.body[name].push(value)
                } else if (_.isString(req.body[name])) {
                    req.body[name] = [req.body[name], value]
                } else {
                    req.body[name] = value
                }
            })
            form.on('part', function (part) {
                if (!part.filename || part.name !== 'file' || req.rejected_by_status) {
                    return part.resume()
                }
                var taskId = req.body.task_id
                if(!taskId) {
                    part.resume()
                    err = new Error()
                    err.state = global.API_RESPONSE_CODE.unauth
                    err.message = '所有接口请求时, 必须包含参数app_id, 以便识别接口身份'
                    res.send(err)
                    return req.rejected_by_status = true
                }
                promises.push(
                    P.resolve()
                        .then(function () {
                            return Memcached.upload(taskId, part, part.filename, true)
                        })
                        .then(function (files) {
                            req.files = req.files.concat(files)
                        }).catch(function (err) {
                        errorCount++
                        req.files.push([{
                            name: part.filename,
                            file_name: Memcached.DOWNLOAD_FAILED,
                            message: err.message
                        }])
                        req.error = err
                        console.trace(err)
                    })
                )
                part.on('error', function (err) {
                    next(err)
                });
            });
            form.on('close', function () {
                P.all(promises).then(function () {
                    if (!req.rejected_by_status) {
                        if (req.files.length) {
                            console.log('图片上传错误数: ' + errorCount)
                            if (errorCount === req.files.length) {
                                err = new Error()
                                err.state = global.API_RESPONSE_CODE.failed
                                err.message = req.error ? req.error.message : '图片上传错误'
                                return res.send(err)
                            }
                        } else {
                            delete req.files
                        }
                        next()
                    }
                })
            });
            form.parse(req);
        } else if (CONTENT_TYPE_URLENCODED === contentType) {
            BodyParser.urlencoded({extended: false, limit: maxFieldsSize, parameterLimit: maxFields})(req, res, next)
        } else if (CONTENT_TYPE_JSON === contentType) {
            BodyParser.json({limit: maxFieldsSize, parameterLimit: maxFields})(req, res, next)
        } else {
            err = new Error()
            err.state = global.API_RESPONSE_CODE.failed
            err.message = '暂时不支持（' + contentType + '）的HTTP请求头类型，支持的类型列表: [multipart/form-data|related；application/x-www-form-urlencoded；application/json]'
            return res.send(err)
        }
    }

    function sendApiRequest(url, data, retries) {
        console.info('接口请求网址: ' + url)
        if (!url) {
            return P.resolve()
        }

        var options = {
            method: "POST",
            timeout: 1000 * 60 * 5,
            data: data,
            dataType: "json",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
        return new P(function (resolve, reject) {
            Urllib.request(url, options, function (err, body, httpResponse) {
                if (err || httpResponse.statusCode !== 200) {
                    err = err || new Error()
                    err.state = global.API_RESPONSE_CODE.failed
                    err.message = err.message || '请求错误, statusCode: ' + httpResponse.statusCode

                    if (retries) {
                        retries = retries - 1;
                        resolve(sendApiRequest(url, data, retries))
                    } else {
                        reject(err)
                    }
                } else {
                    resolve(body)
                }
            })
        })
    }

    function apiLogic(req, res, next) {
        var model = req.params.model || {}
        var action = req.params.action || {}

        var url = [server(), '/api/' + model + '/' + action + '.html'].join('')
        return sendApiRequest(url, req.body, Entry['RETRIES'])
            .then(function (body) {
                res.send(body)
            })
            .catch(function (err) {
                console.trace(err)
                res.send(ApiUtil.response(err.state, err.message))
            })
    }

    app.use(function (req, res, next) {
        req.on('close', function () {
            if (req.clearTimeout)req.clearTimeout()
            req.timedout = true
        })
        next()
    })

    // TODO 待处理 私有云部署仅支持接口
    if(IS_CONFUSION) {
        app.post('/api/:model/:action.html', Authenticate({scope: 'database'}), formHandler, apiLogic)
    } else {
        app.post('/api/:model/:action.html', formHandler, apiLogic)
    }

}
