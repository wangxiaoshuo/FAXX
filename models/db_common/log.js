/**
 * Created by marco on 2017/04/27.
 * 日志表
 */
'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var P = require('bluebird')
var _ = require('lodash')

// 所有动作结果记录表, 如: 图片信息 和 识别信息
var resultSchema = Schema({
    // 动作ID
    actionId: {
        type: String, required: true, index: true
    },
    // 图片路径
    path: {
        type: String, required: true
    },
    // 图片标签
    label: {
        type: Number, default: -1, index: true
    },
    // 图片选项
    option: {
        type: String
    },
    // 是否复审
    review: {
        type: Number, default: -1
    },
    // 识别得分
    score: {
        type: Number, default: -1
    },
    // 实体状态（删除、未识别、已识别和已展示）
    status: {
        type: Number, default: global.COMMON_STATUS.disable, index: true
    },
    // 实体时间（图片上传和识别更新时间）
    time: {
        type: Date, index: true
    }
})

require('../base/schema.js')(resultSchema)

resultSchema.statics.PaddOrUpdate = function (options, untimed) {
    // var query = {identifier: options.identifier}
    var query = {_id: options._id}
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
// resultSchema.statics.Premove = function (id) {
//     return this.Premove({_id: id})
// }

// resultSchema.statics.Pdelete = function (id) {
//     return this.PfindOneAndUpdate({_id: id},{$set: {status: global.COMMON_STATUS.delete}})
// }

resultSchema.statics.PdeleteForMulti = function (query) {
    // 记录时间
    var options = {status: global.COMMON_STATUS.delete}
    var op = {
        time: new Date(Date.now())
    }
    _.extend(options, op)
    return this.Pupdate(query, {$set: options}, {multi: true})
}

// resultSchema.statics.Pupdate = function (id, options) {
//     return this.PfindOneAndUpdate({_id: id}, {$set: options})
// }

resultSchema.statics.PupdateForMulti = function (query, options) {
    return this.Pupdate(query, {$set: options}, {multi: true})
}

resultSchema.statics.PdisableForMulti = function (query) {
    _.extend(query, {status: global.COMMON_STATUS.enable})
    return this.Pupdate(query, {$set: {status: global.COMMON_STATUS.disable}}, {multi: true})
}

// resultSchema.statics.PrelevanceForMulti = function (query, options) {
//     //【权重指派】修改上级块时, 同步修改关联板块和监听器的等级
//     _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
//     // 修改多个关联性的信息
//     var _options = {}
//     var op = {}//【权重指派】不能记录时间
//     if (options.hasOwnProperty('status')) {
//         op = {
//             status: options.status || global.COMMON_STATUS.enable
//         }
//         _.extend(_options, op)
//     }
//     if (options.hasOwnProperty('weight')) {
//         op = {
//             weight: options.weight || global.MC_WEIGHT.level1
//         }
//         _.extend(_options, op)
//     }
//     if (options.hasOwnProperty('ratio')) {
//         op = {
//             ratio: options.ratio || -3
//         }
//         _.extend(_options, op)
//     }
//     return this.Pupdate(query, {$set: _options}, {multi: true})
// }

resultSchema.statics.PcountByCondition = function (query) {
    // 返回不包含软删除的记录
    if (!query.hasOwnProperty('status')) {
        _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
    }
    return this.Pcount(query)
}

resultSchema.statics.PfindByCondition = function (query, sort, skip, limit, projection) {
    // 返回不包含软删除的记录
    if (!query.hasOwnProperty('status')) {
        _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
    }
    return this.Pfind(query, sort, skip, limit, projection)
}

resultSchema.statics.PsumByCondition = function (query, field) {
    // 返回不包含软删除的记录
    if (!query.hasOwnProperty('status')) {
        _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
    }
    var thisModel = this
    return new P(function (resolve, reject, notify) {
        thisModel.aggregate()
            .match(query)
            .group({_id: null, count: {$sum: field}})
            .exec(function (err, doc) {
                if (err) {
                    reject(err)
                } else {
                    resolve((doc && doc[0]) ? doc[0].count : 0)
                }
            })
    })
}

// db.getCollection('results').aggregate([{$match: {label: {$in: [0,1]}}}, {$sort:{time:-1}}, {$group: {_id: "$monitorId", num_tutorial: {$sum: 1}}}])
resultSchema.statics.PgroupByCondition = function (query, field, sort) {
    var thisModel = this
    return new P(function (resolve, reject, notify) {
        thisModel.aggregate()
            .match(query)
            .sort(sort)
            .group({_id: field, count: {$sum: 1}})
            .exec(function (err, doc) {
                if (err) {
                    reject(err)
                } else {
                    resolve(doc)
                }
            })
    })
}

module.exports = resultSchema