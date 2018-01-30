/**
 * Created by marco on 2017/04/26.
 * Part3服务编码
 */
'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var P = require('bluebird')
var _ = require('lodash')

var serviceSchema = Schema({
    // 类编码
    classCode: {
        type: String
    },
    // 类资产描述
    classAssetDescription: {
        type: String
    },
    // 项编码
    itemCode: {
        type: String
    },
    // 项资产描述
    itemAssetDescription: {
        type: String
    },
    // 目编码
    meshCode: {
        type: String
    },
    // 目资产描述
    meshAssetDescription: {
        type: String
    },
    // 节编码
    nodeCode: {
        type: String
    },
    // 节资产描述
    nodeAssetDescription: {
        type: String
    },
    // 子类编码
    subClassCode: {
        type: String
    },
    // 子类资产描述
    subClassAssetDescription: {
        type: String
    },
    // 子项编码
    subItemCode: {
        type: String
    },
    // 子项资产描述
    subItemAssetDescription: {
        type: String
    },
    // 计量单位
    serviceUnit: {
        type: String
    },
    // 服务编码
    serviceCode: {
        type: String, index: true
    },
    // 对应形成的固定资产
    fixedAssets: {
        type: String
    },
    // 对应的会计科目
    accountingSubject: {
        type: String
    },
    // 对应商合平台编码
    businessPlatformCode: {
        type: String
    },
    // 子专业分类编码
    itemSpecializedClassCode: {
        type: String
    },
    // 子专业分类名称
    itemSpecializedClassName: {
        type: String
    },
    // 产品专业分类名称
    productSpecializedClassName: {
        type: String
    },
    // 单价
    price: {
        type: String
    },
    // 税率
    rate: {
        type: String
    },
    // 服务模块中安全生产费（元）
    safetyProductionCosts: {
        type: String
    },
    // 基准价(不含增值税/元)
    standardPrice: {
        type: String
    },
    // 工作内容
    workContent: {
        type: String
    },
    // 修订情况
    revision: {
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

require('../base/schema.js')(serviceSchema)

serviceSchema.statics.PaddOrUpdate = function (options, untimed) {
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
// serviceSchema.statics.Premove = function (query) {
//     return this.Premove(query)
// }

// 软删除, 替换版本数据时可用（移除和新增组成覆盖效果）
serviceSchema.statics.PdeleteForMulti = function (query) {
    // 记录时间
    var options = {status: global.COMMON_STATUS.delete}
    var op = {
        time: new Date(Date.now())
    }
    _.extend(options, op)
    return this.Pupdate(query, {$set: options}, {multi: true})
}

serviceSchema.statics.PcountByCondition = function (query) {
    // 返回不包含软删除的记录
    if (!query.hasOwnProperty('status')) {
        _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
    }
    return this.Pcount(query)
}

serviceSchema.statics.PfindByCondition = function (query, sort, skip, limit, projection) {
    // 返回不包含软删除的记录
    if (!query.hasOwnProperty('status')) {
        _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
    }
    return this.Pfind(query, sort, skip, limit, projection)
}

serviceSchema.statics.PsumByCondition = function (query, field) {
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
    return serviceSchema
}