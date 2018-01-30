/**
 * Created by marco on 2017/04/27.
 * 记录表
 */
'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var P = require('bluebird')
var _ = require('lodash')

var moduleListSchema = Schema({
    // TODO 待处理 继续细化 读取?
    // 物资编码
    materialCode: {
        type: String
    },
    // 物资单价
    materialPrice: {
        type: Number
    },
    // 物资税率
    materialRate: {
        type: Number
    },
    // 物资数量
    materialCount: {
        type: Number
    },
    // 计量单位
    materialUnit: {
        type: String
    },
    // 物资说明
    materialDescription: {
        type: String
    },

    // TODO 待处理 继续细化 读取?
    // 服务编码
    serviceCode: {
        type: String
    },
    // 服务单价
    servicePrice: {
        type: Number
    },
    // 服务税率
    serviceRate: {
        type: Number
    },
    // 服务数量
    serviceCount: {
        type: Number
    },
    // 计量单位
    serviceUnit: {
        type: String
    },
    // 服务说明
    serviceDescription: {
        type: String
    }
})

var planListSchema = Schema({
    // 推荐方案编码（64字以内）
    recommendPlanCode: {
        type: String
    },
    // 推荐方案名称（64字以内）
    recommendPlanName: {
        type: String
    },
    // 方案描述（200字以内）
    recommendPlanDescription: {
        type: String
    },
    // 模块列表
    moduleList: [moduleListSchema]
})

var optionListSchema = Schema({
    // 选项ID
    optionId: {
        type: String, required: true, index: true
    },
    // 应用场景
    applyScene: {
        type: String
    },
    // 建设类型
    constructionType: {
        type: String
    },
    // 是否美化
    isBeautify: {
        type: String
    },
    // 天线挂高
    antennaHeight: {
        type: String
    },
    // 共建信息
    buildInformation: {
        type: String
    },
    // 是否需大型机械进场
    needMachine: {
        type:  String
    },
    // 铁塔
    tower: {
        type: String
    },
    // 机房
    room: {
        type: String
    },
    // 配套
    suit: {
        type: String
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
        type: String
    },
    // 百元投资租金/年（单位元）
    investmentRent: {
        type: String
    },
    //铁塔共享折扣累计
    towerShareSum:{
        type:Number
    },
    //铁塔基准价格（元/年）（不含税）AA
    towerNormalPrice:{
        type:Number
    },
    //机房及配套基准价格（元/年）（不含税）AB
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
    // 方案列表
    planList: [planListSchema],
    // 方案状态（删除、普通、最优）
    status: {
        type: Number, default: global.COMMON_STATUS.disable, index: true
    }
})

// 所有记录表, 如: 图片信息 和 识别信息
var recordSchema = Schema({
    // 用户ID
    accountId: {
        type: String, required: true, index: true
    },
    //最新操作人员
    latestUser:{
      type: Array
    },
    //用户记录
    recordLog:{
      type: Array
    },
    // 站名
    stationName: {
        type: String
    },
    // 省份
    province: {
        type: String
    },
    // 地市
    city: {
        type: String
    },
    // 区县
    county: {
        type: String
    },
    // 地址
    address: {
        type: String
    },
    // 经度
    longitude: {
        type: String
    },
    // 纬度
    latitude: {
        type: String
    },
    actualCost: {
        type: Number
    },
    // 选项列表
    optionList: [optionListSchema],// 一个或者三个选型, 并且设置最优字段
    // 实体状态（删除、选址人员、选型人员和设计人员）
    status: {
        type: Number, default: global.ACCOUNT_ROLES.locater, index: true
    },
    // 实体时间（图片上传和识别更新时间）
    time: {
        type: Date, index: true
    }
})

require('../base/schema.js')(recordSchema)

recordSchema.statics.PaddOrUpdate = function (options, untimed) {
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
// recordSchema.statics.Premove = function (id) {
//     return this.Premove({_id: id})
// }

recordSchema.statics.Pdelete = function (id) {
    return this.PfindOneAndUpdate({_id: id},{$set: {status: global.COMMON_STATUS.delete}})
}

recordSchema.statics.PdeleteForMulti = function (query) {
    // 记录时间
    var options = {status: global.COMMON_STATUS.delete}
    var op = {
        time: new Date(Date.now())
    }
    _.extend(options, op)
    return this.Pupdate(query, {$set: options}, {multi: true})
}

// recordSchema.statics.Pupdate = function (id, options) {
//     return this.PfindOneAndUpdate({_id: id}, {$set: options})
// }

recordSchema.statics.PupdateForMulti = function (query, options) {
    return this.Pupdate(query, {$set: options}, {multi: true})
}

recordSchema.statics.PdisableForMulti = function (query) {
    _.extend(query, {status: global.COMMON_STATUS.enable})
    return this.Pupdate(query, {$set: {status: global.COMMON_STATUS.disable}}, {multi: true})
}

// recordSchema.statics.PrelevanceForMulti = function (query, options) {
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

recordSchema.statics.PcountByCondition = function (query) {
    // 返回不包含软删除的记录
    if (!query.hasOwnProperty('status')) {
        _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
    }
    return this.Pcount(query)
}

recordSchema.statics.PfindByCondition = function (query, sort, skip, limit, projection) {
    // 返回不包含软删除的记录
    if (!query.hasOwnProperty('status')) {
        _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
    }
    return this.Pfind(query, sort, skip, limit, projection)
}

recordSchema.statics.PsumByCondition = function (query, field) {
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

// db.getCollection('records').aggregate([{$match: {label: {$in: [0,1]}}}, {$sort:{time:-1}}, {$group: {_id: "$monitorId", num_tutorial: {$sum: 1}}}])
recordSchema.statics.PgroupByCondition = function (query, field, sort) {
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

module.exports = recordSchema