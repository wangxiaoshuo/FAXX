/**
 * Created by marco on 2017/04/26.
 * Part3推荐方案(100个)
 */
'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var P = require('bluebird')
var _ = require('lodash')

var planSchema = Schema({
    // 地市
    city: {
        type: String
    },
    // 区县
    county: {
        type: String
    },
    // 编号（与城区、农村sheet对应）
    code: {
        type: String, index: true
    },
    // 省分
    provincialBranch: {
        type: String
    },
    // 推荐方案编码（64字以内）
    recommendPlanCode: {
        type: String, index: true
    },
    // 推荐方案名称（64字以内）
    recommendPlanName: {
        type: String
    },
    // 方案描述（200字以内）
    recommendPlanDescription: {
        type: String
    },
    // 铁塔专业产品
    towerProfessionalProducts: {
        type: String
    },
    // 塔基专业产品
    towerFootProfessionalProducts: {
        type: String
    },
    // 机房专业产品
    computerProfessionalProducts: {
        type: String
    },
    // 动力配套专业产品
    powerSupportProfessionalProducts: {
        type: String
    },
    // 其它专业产品
    otherProfessionalProducts: {
        type: String
    },
    // 外电专业产品
    electricProfessionalProducts: {
        type: String
    },
    // 状态
    state: {
        type: String
    },
    // 原因
    reason: {
        type: String
    },
    // 阿坝
    aBa: {
        type: String
    },
    // 巴中
    baZhong: {
        type: String
    },
    // 成都
    chengDu: {
        type: String
    },
    // 达州
    daZhou: {
        type: String
    },
    // 德阳
    deYang: {
        type: String
    },
    // 甘孜
    ganZi: {
        type: String
    },
    // 广安
    guangAn: {
        type: String
    },
    // 广元
    guangYuan: {
        type: String
    },
    // 乐山
    leShan: {
        type: String
    },
    // 凉山
    liangShan: {
        type: String
    },
    // 泸州
    luZhou: {
        type: String
    },
    // 眉山
    meiShan: {
        type: String
    },
    // 绵阳
    mianYang: {
        type: String
    },
    // 南充
    nanChong: {
        type: String
    },
    // 内江
    neiJiang: {
        type: String
    },
    // 攀枝花
    panZhiHua: {
        type: String
    },
    // 遂宁
    suiNing: {
        type: String
    },
    // 雅安
    yaAn: {
        type: String
    },
    // 宜宾
    yiBin: {
        type: String
    },
    // 资阳
    ziYang: {
        type: String
    },
    // 自贡
    ziGong: {
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

require('../base/schema.js')(planSchema)

planSchema.statics.PaddOrUpdate = function (options, untimed) {
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
// planSchema.statics.Premove = function (query) {
//     return this.Premove(query)
// }

// 软删除, 替换版本数据时可用（移除和新增组成覆盖效果）
planSchema.statics.PdeleteForMulti = function (query) {
    // 记录时间
    var options = {status: global.COMMON_STATUS.delete}
    var op = {
        time: new Date(Date.now())
    }
    _.extend(options, op)
    return this.Pupdate(query, {$set: options}, {multi: true})
}

planSchema.statics.PcountByCondition = function (query) {
    // 返回不包含软删除的记录
    if (!query.hasOwnProperty('status')) {
        _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
    }
    return this.Pcount(query)
}

planSchema.statics.PfindByCondition = function (query, sort, skip, limit, projection) {
    // 返回不包含软删除的记录
    if (!query.hasOwnProperty('status')) {
        _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
    }
    return this.Pfind(query, sort, skip, limit, projection)
}

planSchema.statics.PsumByCondition = function (query, field) {
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
    return planSchema
}