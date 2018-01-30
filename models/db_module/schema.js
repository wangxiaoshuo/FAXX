/**
 * Created by marco on 2017/04/26.
 * Part3产品模块库(249个)
 */
'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var P = require('bluebird')
var _ = require('lodash')

var moduleSchema = Schema({
    // 省分
    provincialBranch: {
        type: String
    },
    // 产品编码(64字以内)
    productCode: {
        type: String, index: true
    },
    // 产品名称(64字以内)
    productName: {
        type: String
    },
    // 产品描述(200字以内)
    productDescription: {
        type: String
    },
    // 产品专业
    productProfessional: {
        type: String
    },
    // 物资编码
    materialCode: {
        type: String
    },
    // 物资单价
    materialPrice: {
        type: String
    },
    // 物资税率
    materialRate: {
        type: String
    },
    // 物资数量
    materialCount: {
        type: String
    },
    // 计量单位
    materialUnit: {
        type: String
    },
    // 服务编码
    serviceCode: {
        type: String
    },
    // 服务单价
    servicePrice: {
        type: String
    },
    // 服务税率
    serviceRate: {
        type: String
    },
    // 服务数量
    serviceCount: {
        type: String
    },
    // 计量单位
    serviceUnit: {
        type: String
    },
    // 物资说明
    materialDescription: {
        type: String
    },
    // 服务说明
    serviceDescription: {
        type: String
    },
    // 备注
    remark: {
        type: String
    },
    // 实体状态（删除、异常、正常）
    status: {
        type: Number, default: global.COMMON_STATUS.enable, index: true
    },
    // 实体时间
    time: {
        type: Date
    }
})

require('../base/schema.js')(moduleSchema)

moduleSchema.statics.PaddOrUpdate = function (options, untimed) {
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

// // 硬删除, 替换版本数据时可用（移除和新增组成覆盖效果）
// moduleSchema.statics.Premove = function (query) {
//     return this.Premove(query)
// }

// 软删除, 替换版本数据时可用（移除和新增组成覆盖效果）
moduleSchema.statics.PdeleteForMulti = function (query) {
    // 记录时间
    var options = {status: global.COMMON_STATUS.delete}
    var op = {
        time: new Date(Date.now())
    }
    _.extend(options, op)
    return this.Pupdate(query, {$set: options}, {multi: true})
}

moduleSchema.statics.PcountByCondition = function (query) {
    // 返回不包含软删除的记录
    if (!query.hasOwnProperty('status')) {
        _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
    }
    return this.Pcount(query)
}

moduleSchema.statics.PfindByCondition = function (query, sort, skip, limit, projection) {
    // 返回不包含软删除的记录
    if (!query.hasOwnProperty('status')) {
        _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
    }
    return this.Pfind(query, sort, skip, limit, projection)
}

moduleSchema.statics.PsumByCondition = function (query, field) {
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

module.exports = function () {
    return moduleSchema
}