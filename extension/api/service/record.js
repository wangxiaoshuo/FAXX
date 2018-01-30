'use strict'

var P = require('bluebird')
var mongoose = require('mongoose')
var Record = mongoose.models.record
var _ = require('lodash')
var ApiUtil = require('../lib/util.js')

exports.handler = function (req, res, next) {
    console.log("req.body>>" + JSON.stringify(req.body))

    var action = req.params.action
    var data = JSON.parse(req.body.data)
    var page = parseInt(req.body.page, 10)
    var limit = parseInt(req.body.limit, 10)
    page = isNaN(page) || page < 0 ? 0 : page
    limit = isNaN(limit) || limit <= 0 ? 20 : limit
    var sort = JSON.parse(req.body.sort || '{"_id": 1}')

    var json = ApiUtil.responseInit(-3, '接口未知错误')
    switch (action) {
        case 'save':
            return P.map(data, function (item) {
                return Record.PaddOrUpdate(item)
            }, {concurrency: global.MAP_CONCURRENCY.large})
                .then(function (doc) {
                    json = ApiUtil.response(1, '记录保存成功', doc)
                })
                .catch(function (err) {
                    console.error(err)
                    json = ApiUtil.response(-2, err.message)
                })
                .finally(function () {
                    res.send(json)
                })
            break
        case 'delete':
            return P.map(data, function (item) {
                return Record.Pdelete(item)
            }, {concurrency: global.MAP_CONCURRENCY.large})
            // TODO 待优化 不知道为什么会报:CastError: Cast to ObjectId failed for value "[object Object]" at path "_id"
            // .then(function (_ids) {
            //     // 根据记录_id列表删除记录列表
            //     return Record.PdeleteForMulti({_id: {$in: _ids}})
            // })
                .then(function (doc) {
                    json = ApiUtil.response(1, '记录删除成功', doc)
                })
                .catch(function (err) {
                    console.error(err)
                    json = ApiUtil.response(-2, err.message)
                })
                .finally(function () {
                    res.send(json)
                })
            break
        case 'find':
            // 空数组必须转为空对象, 否则无法正常使用数据脚本, 如: 添加status字段
            if (data && data.length == [].length) {
                data = {}
            }
            // 分页功能
            var total = 0
            return P.resolve()
                .then(function () {
                    if (data.keywords && data.keywords.length > 0) {// 根据基站名称查找对应记录, eg: data=["文杏酒楼站", "天府广场站"]
                        return P.map(data.keywords, function (keyword) {
                            // 支持模糊查找 [/key1/,/key2/]
                            return eval('/' + keyword + '/')
                        }, {concurrency: global.MAP_CONCURRENCY.large})
                            .then(function (_keywords) {
                                var query = {stationName: {"$in": _keywords}}
                                // 必须含city为检索
                                _.extend(query, {city: data.city})
                                return Record.PcountByCondition(query)
                                    .then(function (count) {
                                        total = count
                                        return Record.PfindByCondition(query, sort, page * limit, limit)
                                    })
                            })
                    } else {// 查找所有记录, eg: data={} 或者查找其他的条件对应记录
                        var query = data
                        return Record.PcountByCondition(query)
                            .then(function (count) {
                                total = count
                                return Record.PfindByCondition(query, sort, page * limit, limit)
                            })
                    }
                })
                .then(function (doc) {
                    json = ApiUtil.response(1, '记录查找成功', doc, total)
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