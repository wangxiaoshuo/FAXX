/**
 * Created by marco on 2017/04/27.
 * 配置表
 */
'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var P = require('bluebird')
var _ = require('lodash')

var settingSchema = Schema({
    // 指定版本
    versionName: {
        type: String, required: true, index: true
    },
    // 实体状态（删除、异常和正常）
    status: {
        type: Number, default: global.COMMON_STATUS.disable, index: true
    },
    // 实体时间
    time: {
        type: Date, index: true
    }
})

require('../base/schema.js')(settingSchema)

settingSchema.statics.PaddOrUpdate = function (options, untimed) {
    // 永远只有一条数据, 无需条件修改
    var query = {}
    var thisModel = this
    return this.PfindOne(query)
        .then(function (doc) {
            // 计时的状态就设置当前时间
            if (!untimed) {
                var op = {
                    time: new Date(Date.now())
                }
                _.extend(options, op)
            }
            // 新增 或者 覆盖
            if (!doc || doc.length === 0) {
                return thisModel.Psave(options)
                    .then(function (doc) {
                        doc.add = true
                        return doc
                    })
            } else {
                delete options._id
                return thisModel.PfindOneAndUpdate(query, {$set: options})
                    .then(function (doc) {
                        doc.add = false
                        return doc
                    })
            }
        })
}

// 硬删除, 前期禁止调用
// settingSchema.statics.Premove = function (id) {
//     return this.Premove({_id: id})
// }

settingSchema.statics.Pdelete = function (id) {
    return this.PfindOneAndUpdate({_id: id},{$set: {status: global.COMMON_STATUS.delete}})
}

// settingSchema.statics.PdeleteForMulti = function (query) {
//     // 记录时间
//     var options = {status: global.COMMON_STATUS.delete}
//     var op = {
//         time: new Date(Date.now() + (8 * 60 * 60 * 1000))
//     }
//     _.extend(options, op)
//     return this.Pupdate(query, {$set: options}, {multi: true})
// }

// settingSchema.statics.Pupdate = function (id, options) {
//     return this.PfindOneAndUpdate({_id: id}, {$set: options})
// }

// settingSchema.statics.PupdateForMulti = function (query, options) {
//     return this.Pupdate(query, {$set: options}, {multi: true})
// }
//
// settingSchema.statics.PdisableForMulti = function (query) {
//     _.extend(query, {status: global.COMMON_STATUS.enable})
//     return this.Pupdate(query, {$set: {status: global.COMMON_STATUS.disable}}, {multi: true})
// }

settingSchema.statics.PcountByCondition = function (query) {
    // 返回不包含软删除的记录
    if (!query.hasOwnProperty('status')) {
        _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
    }
    return this.Pcount(query)
}

// settingSchema.statics.PfindByCondition = function (query, sort, skip, limit, projection) {
//     // 返回不包含软删除的记录
//     if (!query.hasOwnProperty('status')) {
//         _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
//     }
//     return this.Pfind(query, sort, skip, limit, projection)
// }
//
// settingSchema.statics.PsumByCondition = function (query, field) {
//     // 返回不包含软删除的记录
//     if (!query.hasOwnProperty('status')) {
//         _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
//     }
//     var thisModel = this
//     return new P(function (resolve, reject, notify) {
//         thisModel.aggregate()
//             .match(query)
//             .group({_id: null, count: {$sum: field}})
//             .exec(function (err, doc) {
//                 if (err) {
//                     reject(err)
//                 } else {
//                     resolve((doc && doc[0]) ? doc[0].count : 0)
//                 }
//             })
//     })
// }

module.exports = settingSchema