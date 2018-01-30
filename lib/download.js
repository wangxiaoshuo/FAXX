'use strict';

var P = require('bluebird')
var _ = require('lodash')
var urllib = require('urllib')
var http = require('http')
var https = require('https')
var URL = require('url')

var Config = require('../config.js')
var Constant = Config['Constant'] || {}
var Memcached = require('./memcached.js')
var MyUtil = require('./util.js')
var ApiUtil = require('../extension/api/lib/util.js')

var SUCCEED = 0
var EXCEPTIONS = 0

exports.getFileList = function (apiKey, files, isWriteDisk) {
    if (!_.isArray(files)) {
        files = [files]
    }

    var type = "";
    return P.resolve().then(function () {
        if (_.isString(files[0])) {
            type = "URL";
            return downloadAndGetFileList(apiKey, files, isWriteDisk)
        } else {
            type = "FILE";
            return files
        }
    }).then(function (file_list) {
        if (file_list.length > 0) {
            return {file_list: file_list, zipName: file_list[0].name, image: type}
        } else {
            return ApiUtil.responseFail(global.API_RESPONSE_CODE.failed_other, '不能够获取已经上传的文件')
        }
    })
}

function downloadAndGetFileList(apiKey, files, isWriteDisk) {
    var _err = null
    var errors = 0

    return P.map(files, function (file) {

        return downloadAndReturnStream(file, 3)
            .then(function (rs) {
                return Memcached.upload(apiKey, rs, file, isWriteDisk)
            })
            .catch(function (err) {
                errors++
                if (err && !err.userError) {
                    EXCEPTIONS++
                }
                _err = err
                console.error('[downloadAndGetFileList] 错误信息: ', err.message, file)

                return [{name: file, file_name: Memcached.DOWNLOAD_FAILED, message: err.message}]
            })
    }, {concurrency: 20}).then(function (listArr) {
        SUCCEED += (files.length - errors)

        if (files.length === errors) {
            return P.reject(_err)
        }
        else {
            var file_list = []
            listArr.forEach(function (list) {
                file_list = file_list.concat(list)
            })
            return file_list
        }
    })
}

setInterval(function () {
    console.log('下载汇总信息 成功: ', SUCCEED, ', 异常: ', EXCEPTIONS)
    console.log('实例下载已完成: ', SUCCEED, ', 失败: ', EXCEPTIONS)
    SUCCEED = 0
    EXCEPTIONS = 0
}, 1000 * 60)

var httpKeepAliveAgent = new http.Agent({keepAlive: true, maxSockets: 1000});
var httpsKeepAliveAgent = new https.Agent({keepAlive: true, maxSockets: 1000});

function downloadAndReturnStream(fileURL, retries) {
    return getResponseStream(fileURL)
        .then(function (response) {
            if (response.statusCode !== 200) {
                retries = 0;
                var err = new Error('响应状态码: ' + response.statusCode)
                err.userError = true
                err.state = global.API_RESPONSE_CODE.failed_other
                return P.reject(err)
            } else {
                return response
            }
        })
        .catch(function (err) {
            if (retries) {
                retries = retries - 1
                return downloadAndReturnStream(fileURL, retries)
            } else {
                return P.reject(err)
            }
        })
}

function getResponseStream(fileURL) {
    var url = URL.parse(fileURL)
    var timeout = MyUtil.isZip(url.pathname) ? 1000 * 15 : 1000 * 5;
    var options = {
        timeout: timeout
        , agent: httpKeepAliveAgent
        , httpsAgent: httpsKeepAliveAgent
        , followRedirect: true
        , maxRedirects: 3
        , streaming: true
    }
    return new P(function (resolve, reject) {
        urllib.request(fileURL, options, function (err, data, response) {
            if (err) {
                reject(err)
            } else {
                resolve(response)
            }
        })
    })
}