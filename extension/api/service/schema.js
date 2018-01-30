'use strict'

var P = require('bluebird')
var mongoose = require('mongoose')
var Account = mongoose.models.account
var Setting = mongoose.models.setting
var Record = mongoose.models.record
var Log = mongoose.models.log
var Models = require('../../../models/models.js')
var _ = require('lodash')
var ApiUtil = require('../lib/util.js')

exports.handler = function (req, res, next) {
    console.log("req.body>>" + JSON.stringify(req.body))

    var action = req.params.action
    var schema = req.body.schema
    var data = JSON.parse(req.body.data)
    var page = parseInt(req.body.page, 10)
    var limit = parseInt(req.body.limit, 10)
    page = isNaN(page) || page < 0 ? 0 : page
    limit = isNaN(limit) || limit <= 0 ? 20 : limit
    var sort = JSON.parse(req.body.sort || '{"_id": 1}')

    var json = ApiUtil.responseInit(-3, '接口未知错误')

    switch (action) {
        case 'find':
            if (!schema) {
                json = ApiUtil.response(-2, schema + '模式不存在')
                res.send(json)
            }
            var version = undefined
            // 模式实体
            var model = undefined
            // 分页功能
            var total = 0
            return P.resolve()
                .then(function () {
                    // TODO 待处理 只返回启用的版本实体
                    return Setting.PfindOne({})
                })
                .then(function (doc) {
                    version = doc ? doc.versionName : ''
                    // var version = 'v20170426195805'
                    if (schema == 'account') {
                        model = Account
                    } else if (schema == 'setting') {
                        model = Setting
                    } else if (schema == 'record') {
                        model = Record
                    } else if (schema == 'log') {
                        model = Log
                    } else if (schema == 'option') {
                        model = Models.initOptionDB(version)
                    } else if (schema == 'plan') {
                        model = Models.initPlanDB(version)
                    } else if (schema == 'module') {
                        model = Models.initModuleDB(version)
                    } else if (schema == 'material') {
                        model = Models.initMaterialDB(version)
                    } else if (schema == 'service') {
                        model = Models.initServiceDB(version)
                    }
                    // 查找所有模式, eg: data={} 或者查找其他的条件对应模式
                    var query = data
                    if (query.hasOwnProperty('_ids')) {// 支持_id列表查询
                        _.extend(query, {_id: {"$in": data._ids}})
                        delete query._ids
                    }
                    if (query.hasOwnProperty('keywords')) {// 支持keywords查询
                        data.keywords.forEach(function (keyword, k) {
                            // 支持模糊查找 [/key1/,/key2/]
                            data.keywords[k] = eval('/' + keyword + '/')
                        })
                        // 目前支持类型编码 和 各种描述 的模糊查询
                        _.extend(query, {$or: [{materialCode: {"$in": data.keywords}}, {serviceCode: {"$in": data.keywords}}, {classAssetDescription: {"$in": data.keywords}}, {itemAssetDescription: {"$in": data.keywords}}, {meshAssetDescription: {"$in": data.keywords}}, {nodeAssetDescription: {"$in": data.keywords}}, {subClassAssetDescription: {"$in": data.keywords}}, {subItemAssetDescription: {"$in": data.keywords}}, {subMeshAssetDescription: {"$in": data.keywords}}]})
                        delete query.keywords
                    }
                    return model.PcountByCondition(query)
                        .then(function (count) {
                            total = count
                            return model.PfindByCondition(query, sort, page * limit, limit)
                        })
                })
                .then(function (doc) {
                    json = ApiUtil.response(1, schema + '模式查找成功', doc, total)
                }).catch(function (err) {
                    console.error(err)
                    json = ApiUtil.response(-2, err.message)
                })
                .finally(function () {
                    res.send(json)
                })
            break
        default:
            json = ApiUtil.response(-2, 'Action 不存在')
            res.send(json)
            break
    }
}