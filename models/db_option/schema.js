/**
 * Created by marco on 2017/04/26.
 * Part1&Part2
 */
'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var P = require('bluebird')
var _ = require('lodash')

var optionSchema = Schema({
    // 地市
    city: {
        type: String, index: true
    },
    // 区县
    county: {
        type: String, index: true
    },
    // 应用场景
    applyScene: {
        type: String, index: true
    },
    // 建设类型
    constructionType: {
        type: String, index: true
    },
    // 是否美化
    isBeautify: {
        type: String, index: true
    },
    // 天线挂高
    antennaHeight: {
        type: String, index: true
    },
    // 共建信息
    buildInformation: {
        type: String, index: true
    },
    // 是否需大型机械进场
    needMachine: {
       type:  String, index: true
    },
    // 铁塔
    tower: {
        type: String, index: true
    },
    // 机房
    room: {
        type: String, index: true
    },
    // 配套
    suit: {
        type: String, index: true
    },
    // 输出
    output: {
        type: String
    },
    // 铁塔成本
    towerCost: {
        type: String
    },
    // 机房成本
    roomCost: {
        type: String
    },
    // 配套成本
    suitCost: {
        type: String
    },
    // 实际建设成本合计
    totalCost: {
        type: String
    },
    // 标准建设成本
    totalPrice: {
        type: String
    },
    // 造价综合差异率*100（单位%）
    differenceRate: {
        type: String, index: true
    },
    // 百元投资租金/年（单位元）
    investmentRent: {
        type: String, index: true
    },
    //铁塔共享折扣累计
    towerShareSum:{
        type:Number
    },
    //铁塔基准价格（元/年）（不含税）
    towerNormalPrice:{
        type:Number
    },
    //机房及配套基准价格（元/年）（不含税）
    machineRoomPrice:{
        type:Number
    },
    //维护费（元/年）
    upkeep:{
        type:Number
    },
    //毛利率（%）
    profit:{
        type:String
    },
    //电力费年成本（单位元）预估
    electric:{
        type:Number
    },
    //场租费年成本（单位元）预估
    site:{
        type:Number
    },
    // 对应编号1
    correspondingNumber1: {
        type: String, index: true
    },
    // 对应编号2
    correspondingNumber2: {
        type: String, index: true
    },
    // 对应编号3
    correspondingNumber3: {
        type: String, index: true
    },
    // 对应编号4
    correspondingNumber4: {
        type: String, index: true
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

require('../base/schema.js')(optionSchema)

optionSchema.statics.PaddOrUpdate = function (options, untimed) {
    // 注意, 每次都是等同一个新数据插入
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
// optionSchema.statics.Premove = function (query) {
//     return this.Premove(query)
// }

// 软删除, 替换版本数据时可用（移除和新增组成覆盖效果）
optionSchema.statics.PdeleteForMulti = function (query) {
    // 记录时间
    var options = {status: global.COMMON_STATUS.delete}
    var op = {
        time: new Date(Date.now())
    }
    _.extend(options, op)
    return this.Pupdate(query, {$set: options}, {multi: true})
}

optionSchema.statics.PcountByCondition = function (query) {
    // 返回不包含软删除的记录
    if (!query.hasOwnProperty('status')) {
        _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
    }
    return this.Pcount(query)
}

optionSchema.statics.PfindByCondition = function (query, sort, skip, limit, projection) {
    // 返回不包含软删除的记录
    if (!query.hasOwnProperty('status')) {
        _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
    }
    return this.Pfind(query, sort, skip, limit, projection)
}

optionSchema.statics.PsumByCondition = function (query, field) {
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

// db.getCollection('v20170426170857').aggregate({$match: {"status" : 1}}, {$group: {_id: {city: "$city", county: "$county", applyScene: "$applyScene", constructionType: "$constructionType", isBeautify: "$isBeautify", antennaHeight: "$antennaHeight", buildInformation: "$buildInformation"}, records: {$push: {_id: '$_id'}}}})
optionSchema.statics.PgroupByCondition = function (query, field, records) {
    // 返回不包含软删除的记录
    if (!query.hasOwnProperty('status')) {
        _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
    }
    var group = {_id: field}
    // 是否返回附加记录的信息
    if (records) {
        _.extend(group, {records: {$push: records}})
    }
    var thisModel = this
    return new P(function (resolve, reject, notify) {
        thisModel.aggregate()
            .match(query)
            .group(group)
            .exec(function (err, doc) {
                if (err) {
                    reject(err)
                } else {
                    resolve(doc)
                }
            })
    })
}

module.exports = function () {
    return optionSchema
}