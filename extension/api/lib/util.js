'use strict';

var P = require('bluebird')
var fs = P.promisifyAll(require('fs'))
var request = require('request')

var Config = require('../../../config.js')
var Constant = Config['Constant'] || {}
var DataDisks = Config['DataDisks'] || {}
var MyUtil = require('../../../lib/util.js')

exports.responseInit = function (state, message) {
    return exports.response(state, message)
}

// 响应通过组装JSON
exports.response = function (state, message, data, total) {
    var json = {state: state, message: message, data: data || {}}
    if (total) {
        json = {state: state, message: message, data: data || {}, total: total}
    }
    return json
}

// exports.dbStoragePath = function (abPath) {
//     var dispatchDataDisks = global.isAPP ? DataDisks['APP'] : DataDisks['API']
//     var indexOfDate = abPath.search(/\/\d{4}-\d{2}-\d{2}\//)
//         , start = abPath.substring(0, indexOfDate + 1)
//         , disk = dispatchDataDisks[start]
//     return {relate: abPath.substring(indexOfDate + 1), prefix: disk ? disk.link : ''}
// }