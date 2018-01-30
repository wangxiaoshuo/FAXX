'use strict'

var P = require('bluebird')
var mongoose = require('mongoose')
var Account = mongoose.models.account
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
                return Account.PaddOrUpdate(item)
            }, {concurrency: global.MAP_CONCURRENCY.large})
                .then(function (doc) {
                    json = ApiUtil.response(1, '用户保存成功', doc)
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
                    return Account.Pdelete(item)
                }, {concurrency: global.MAP_CONCURRENCY.large})
                // TODO 待优化 不知道为什么会报:CastError: Cast to ObjectId failed for value "[object Object]" at path "_id"
                // .then(function (_ids) {
                //     // 根据用户_id列表删除用户列表
                //     return Account.PdeleteForMulti({_id: {$in: _ids}})
                // })
                .then(function (doc) {
                    json = ApiUtil.response(1, '用户删除成功', doc)
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
                    if (data.length > 0) {// 根据用户名称（工号）查找对应用户, eg: data=["285625881@qq.com", "J1424"]
                        return P.map(data, function (item) {
                            // 支持模糊查找 [/key1/,/key2/]
                            return eval('/' + item + '/')
                        }, {concurrency: global.MAP_CONCURRENCY.large})
                            .then(function (_items) {
                                var query = {username: {"$in": _items}}
                                return Account.PcountByCondition(query)
                                    .then(function (count) {
                                        total = count
                                        return Account.PfindByCondition(query, sort, page * limit, limit)
                                    })
                            })
                    } else {// 查找所有用户, eg: data={} 或者查找其他的条件对应用户
                        var query = data
                        return Account.PcountByCondition(query)
                            .then(function (count) {
                                total = count
                                return Account.PfindByCondition(query, sort, page * limit, limit)
                            })
                    }
                })
                .then(function (doc) {
                    json = ApiUtil.response(1, '用户查找成功', doc, total)
                }).catch(function (err) {
                    console.error(err)
                    json = ApiUtil.response(-2, err.message)
                })
                .finally(function () {
                    res.send(json)
                })
            break
        case 'bind':
            // 先检查是否通过微信进入应用
            if (!data.openId) {
                json = ApiUtil.response(-3, '请在微信客户端打开链接, 请联系管理员')
                return res.send(json)
            }
            // 再检查微信是否已被绑定工号
            return Account.PfindOne({openId: data.openId})
                .then(function (doc) {
                    // 微信已有绑定的用户并且不是原工号时弹窗提示
                    if (doc && doc.username != data.username) {
                        json = ApiUtil.response(-2, '该微信已绑定其他工号, 请联系管理员', doc)
                        return res.send(json)
                    }
                    return Account.PfindOne({username: data.username})
                })
                .then(function (doc) {
                    if (doc) {
                        // 再以最新微信网页授权OpenId和工号进行绑定
                        doc.openId = data.openId
                        doc.name = data.name
                        return Account.PaddOrUpdate(doc)
                            .then(function (doc) {
                                json = ApiUtil.response(1, '工号成功绑定微信', doc)
                                return res.send(json)
                            })
                    } else {
                        json = ApiUtil.response(-2, '工号不存在或工号已绑定其他微信, 请联系管理员', doc)
                        return res.send(json)
                    }
                })
                .catch(function (err) {
                    console.error(err)
                    json = ApiUtil.response(-2, err.message)
                    return res.send(json)
                })
            break
        default:
            json = ApiUtil.response(-2, 'Action 不存在')
            return res.send(json)
            break
    }
}