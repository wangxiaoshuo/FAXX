'use strict'

var P = require('bluebird')
var _ = require('lodash')
var Schedule = require("node-schedule")
var mongoose = require('mongoose')
var Urllib = require('urllib')

var Config = require('../config.js')
var Constant = Config['Constant'] || {}
var Entry = Config['Entry'] || {}
var ApiUtil = require('../extension/api/lib/util.js')
// var Models = require('../models/models.js')
// var Action_ = require('../extension/api/service/action.js')
//
// var ApiTask = mongoose.models.apiTask
// var Application = mongoose.models.application
// var ApiSummary = mongoose.models.apiSummary
//
// var Category = mongoose.models.category
// var Platform = mongoose.models.platform
// var Classify = mongoose.models.classify
// var Room = mongoose.models.room
// var Anchor = mongoose.models.anchor
// var Mapping = mongoose.models.mapping
// var Action = mongoose.models.action
// var Result = mongoose.models.result

exports.appInit = function () {
    // var promises = []
    // // 支持添加多个
    // promises.push(genAppSummary())
    // promises.push(syncActionData())
    // return P.all(promises)
}

exports.entryInit = function () {
    // var promises = []
    // // 支持添加多个
    // promises.push(handleAiLogic())
    // return P.all(promises)
}

exports.apiInit = function () {
    // var promises = []
    // // 支持添加多个
    // promises.push(genApiSummary())
    // return P.all(promises)
}

// // 直播平台入库数据前必须先同步, 这样保证都是在线状态的房间
// // 类目、平台、分类 三大块统计 在线数量根据Mapping状态定期读取条数
// function genAppSummary() {
//     Category.PfindByCondition({})
//         .then(function (categories) {
//             // var actionIds = []
//             return P.map(categories, function (category) {
//                 return Mapping.PcountByCondition({
//                     parentId: category._id.toString(),
//                     status: global.COMMON_STATUS.enable
//                 })
//                     .then(function (count) {
//                         category.onlineCount = count
//                         // console.info('该类目下在线平台的数量: ' + category.onlineCount)
//                         return Category.PaddOrUpdate(category, {}, true)
//                     })
//             }, {concurrency: global.MAP_CONCURRENCY.large})
//         })
//         .then(function (doc) {
//             // var actionIds = []
//             return Platform.PfindByCondition({})
//                 .then(function (platforms) {
//                     return P.map(platforms, function (platform) {
//                         return Mapping.PcountByCondition({
//                             parentId: platform._id.toString(),
//                             status: global.COMMON_STATUS.enable
//                         })
//                             .then(function (count) {
//                                 platform.onlineCount = count
//                                 // console.info('该平台下在线分类的数量: ' + platform.onlineCount)
//                                 return Platform.PaddOrUpdate(platform, {}, true)
//                             })
//                     }, {concurrency: global.MAP_CONCURRENCY.large})
//                 })
//         })
//         .then(function (doc) {
//             // var actionIds = []
//             return Classify.PfindByCondition({})
//                 .then(function (classifies) {
//                     return P.map(classifies, function (classify) {
//                         return Mapping.PcountByCondition({
//                             parentId: classify._id.toString(),
//                             status: global.COMMON_STATUS.enable
//                         })
//                             .then(function (count) {
//                                 classify.onlineCount = count
//                                 // console.info('该分类下在线房间的数量: ' + classify.onlineCount)
//                                 return Classify.PaddOrUpdate(classify, {}, true)
//                             })
//                     }, {concurrency: global.MAP_CONCURRENCY.large})
//                 })
//         })
//         .catch(function (err) {
//             console.trace('生成统计信息错误: ', err)
//         })
//         .finally(function () {
//             genAppSummary()
//         })
//
// }

// // 同步正在重点动作的数据和报表
// // TODO ......支持更多维度时
// // 动作列表级别分两种：
// // 1、普通动作列表：
// // 权重（人为设置）、比值（自变权重[-1|+1]和动作次数|识别结果有关[违规|无人脸]）、最新房间（无添加的时间字段）、最旧房间（有识别的时间字段）
// // 2、重点动作列表：
// // 基于平台定期扫描：以房间和主播为基础，违规数量多的、观看数量多的、粉丝数量多的、财富数量多的等等，都会自动修改为重点动作级别。
// // 注意：按数量的前10名排序才修改为重点动作器！
// function syncActionData() {
//     var runCount = 1
//     var recurrenceRule = new Schedule.RecurrenceRule()
//     var times_second = [1,31] // 每5秒 [1,6,11,16,21,26,31,36,41,46,51,56] 每15秒 [1,16,31,46] 每30秒 [1,31]
//     recurrenceRule.second = times_second
//     // var times_minute = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60]// 每1分种执行一次 每5分钟 [1,6,11,16,21,26,31,36,41,46,51,56] 每15分钟 [1,16,31,46] 每30分钟 [1,31]
//     // recurrenceRule.minute = times_minute
//     // var times_hour = [1,2,3,4,5,6,7,8,9,10,11,12]// 每1小时执行一次
//     // recurrenceRule.hour  = times_hour
//     Schedule.scheduleJob(recurrenceRule, function () {
//         console.log('[syncActionData] 计时器执行次数: ' + runCount)
//         // var categoryIds = []
//         // var platformIds = []
//         // var classifyIds = []
//         // var roomIds = []
//         // var anchorIds = []
//         // var actionIds = []
//         // var resultIds = []
//         // 先找出所有平台, 并且遍历平台
//         Platform.PfindByCondition({})
//             .then(function (platforms) {// 得到了平台实例列表
//                 return P.map(platforms, function (platform) {
//                     // 找出该平台下的所有房间id列表和主播id列表
//                     var classifyIds = []
//                     var roomIds = []
//                     var anchorIds = []
//                     // 再根据平台id映射找出对应分类id列表
//                     return Mapping.PfindByCondition({
//                         parentId: platform._id.toString(),
//                         status: global.COMMON_STATUS.enable
//                     })
//                         .then(function (docs) {
//                             return P.map(docs, function (item) {
//                                 return item.relatedId
//                             })
//                         })
//                         .then(function (_ids) {// 得到了分类id列表
//                             classifyIds = _ids
//                             // 再根据分类id映射找出对应房间id列表
//                             return Mapping.PfindByCondition({
//                                 parentId: {"$in": classifyIds},
//                                 status: global.COMMON_STATUS.enable
//                             })
//                                 .then(function (docs) {
//                                     return P.map(docs, function (item) {
//                                         return item.relatedId
//                                     })
//                                 })
//                         })
//                         .then(function (_ids) {// 得到了房间id列表
//                             roomIds = _ids
//                             // TODO 待处理 【权重指派】暂时只根据在线房间的观众数多的前2名为重点动作对象
//                             var query = {
//                                 _id: {"$in": roomIds},
//                                 status: global.COMMON_STATUS.enable
//                             }
//                             var sort = {onlineCount: -1}// wealthCount: -1 按观看数量多、当前财富多排序
//                             var page = 0
//                             var limit = 10
//                             return Room.PfindByCondition(query, sort, page * limit, limit)
//                                 .then(function (docs) {
//                                     return P.map(docs, function (item) {
//                                         return item._id.toString()
//                                     })
//                                 })
//                         })
//                         .then(function (_ids) {// 排序后的房间_id列表
//                             // 修改动作器级别level字段
//                             var query = {roomId: {"$in": _ids}}
//                             var options = {level: global.COMMON_STATUS.enable}
//                             return Action.PupdateForMulti(query, options)
//                         })
//                         .then(function (doc) {
//                             // 再根据房间id映射找出对应主播id列表
//                             return Mapping.PfindByCondition({
//                                 parentId: {"$in": roomIds},
//                                 status: global.COMMON_STATUS.enable
//                             })
//                                 .then(function (docs) {
//                                     return P.map(docs, function (item) {
//                                         return item.relatedId
//                                     })
//                                 })
//                         })
//                         .then(function (_ids) {// 得到了主播id列表
//                             anchorIds = _ids
//                             // TODO 待处理
//                             // TODO 再根据主播_id列表, 按粉丝数量、累计财富多排序
//                             // TODO 并且修改对应的动作器级别level字段
//                             return platform
//                         })
//                 }, {concurrency: global.MAP_CONCURRENCY.large})
//             })
//             .catch(function (err) {
//                 console.trace('同步动作器数据错误: ', err)
//             })
//         runCount++
//     })
//
// }

// // 处理接口逻辑
// // 1、识别接口
// function handleAiLogic() {
//     // TODO 指派截图数量
//     // 先检索出所有的最新插入的图片
//     var query = {
//         status: global.COMMON_STATUS.disable// 找出为未识别状态
//     }
//     var page = 0
//     var limit = 20
//     var sort = '{"time": 1}'
//     var total = 0
//
//     var json = ApiUtil.responseInit(-3, '接口未知错误')
//
//     var resultList = []
//     Result.PcountByCondition(query)
//         .then(function (count) {
//             total = count
//             return Result.PfindByCondition(query, sort, page * limit, limit)
//         })
//         .then(function (docs) {
//             resultList = docs
//             if (!resultList || resultList.length <= 0) {
//                 json = ApiUtil.responseInit(-2, '暂无最新数据')
//                 return
//             }
//             // 再批量调用AI识别的接口
//             var paths = []
//             for (var i = 0; i < resultList.length; i++) {
//                 var result = resultList[i]
//                 if (result.path) {
//                     // TODO 注意
//                     // 1、局域网 和 广域网 的图片连接适配问题
//                     // 2、组装有效的图片连接, IB交换机需要直接提交图片最快
//                     paths.push(Constant['IMAGE_URL'] + result.path)
//                 }
//             }
//             if (!paths || paths.length <= 0) {
//                 json = ApiUtil.responseInit(-2, '暂无最新图片')
//                 return
//             }
//             // TODO 待处理 支持判断是否有人再调用鉴黄接口
//             // TODO 待处理 目前只支持色情识别人工智能接口
//             var url = Constant['AI_URL']
//             var data = {
//                 task_id: '581f28a99ace98ff384005e0',
//                 file: paths
//             }
//             return sendApiRequest(url, data, Entry['RETRIES'])
//                 .then(function (body) {
//                     console.info('[handleAiLogic] 人工智能识别结果:' + JSON.stringify(body))
//                     if (body.state == 1 && body.data) {
//                         // TODO 待处理 目前只支持色情识别人工智能接口
//                         var picture = body.data.porn.picture
//                         // console.log('picture>>' + JSON.stringify(picture))
//                         json = ApiUtil.response(1, '智能识别成功', picture, total)
//                         return body
//                     } else {
//                         json = ApiUtil.response(-2, '人工智能识别请求错误')
//                         return body
//                     }
//                 })
//                 .catch(function (err) {
//                     console.trace(err)
//                     json = ApiUtil.response(-2, err.message)
//                 })
//         })
//         .then(function () {
//             // 最后更新动作器和动作记录
//             // console.log('[handleAiLogic] 请求接口响应实体: ' + JSON.stringify(json))
//             if (json.state == 1) {
//                 return P.map(resultList, function (result, i) {
//                     var d = json.data[i]
//                     var _action = {}
//                     return Action.PfindOne({_id: result.actionId})
//                         .then(function (action) {
//                             // 全局动作器变量, 为了能够保持先有记录再更新动作器
//                             _action = action
//                             result.label = d.label
//                             result.option = d.option
//                             // TODO 暂时提升准确率: 判断为性感, 但如果分数没有上50, 就不标记为性感
//                             if (d.label == 1 && d.score < 48.5) {
//                                 result.label = 2
//                                 result.option = '正常/normal'
//                             }
//                             // TODO 暂时提升准确率: 判断为色情, 但如果分数没有上95, 就不标记为色情
//                             if (d.label == 0 && d.score < 98.5) {
//                                 result.label = 2
//                                 result.option = '正常/normal'
//                             }
//                             result.review = d.review
//                             result.score = d.score
//                             // 识别时修改status和time值
//                             result.status = global.COMMON_STATUS.enable// 修改为已识别状态
//                             result.time = new Date(Date.now() + (8 * 60 * 60 * 1000))
//                             return Result.PaddOrUpdate(result)
//                         })
//                         .then(function (doc) {
//                             //【权重指派】违规和疑似违规 越多, 动作几率就越大
//                             //【权重指派】遇到严重违规的直接识别后更新动作器级别level字段, 改为重点动作
//                             // TODO "label": 0 or 1 为疑似违规
//                             if (d.label == 0 || d.label == 1) {
//                                 _action.ratio = (_action.ratio || 0) - 1
//                                 _action.violationCount = (_action.violationCount || 0) + 1
//                                 _action.level = global.COMMON_STATUS.enable
//                             }
//                             // 识别一次动作器增加一次动作
//                             _action.count = (_action.count || 0) + 1
//                             // // 判断到当前是有识别时才能修改时间值
//                             // _action.time = new Date(Date.now() + (8 * 60 * 60 * 1000))
//                             return Action.PaddOrUpdate(_action)
//                         })
//                 }, {concurrency: global.MAP_CONCURRENCY.large})
//             }
//         }).catch(function (err) {
//         console.trace(err)
//     }).finally(function () {
//         handleAiLogic()
//     })
// }
// function sendApiRequest(url, data, retries) {
//     console.info('接口请求网址: ' + url)
//     if (!url) {
//         return P.resolve()
//     }
//
//     var options = {
//         method: "POST",
//         timeout: 1000 * 60 * 5,
//         data: data,
//         dataType: "json",
//         headers: {
//             'Content-Type': 'application/x-www-form-urlencoded',
//             'Authorization': 'Bearer e3e171e188ac730aa5efdeb655307eeeb27ba249'
//         }
//     }
//     return new P(function (resolve, reject) {
//         Urllib.request(url, options, function (err, body, httpResponse) {
//             if (err || httpResponse.statusCode !== 200) {
//                 err = err || new Error()
//                 err.state = global.API_RESPONSE_CODE.failed
//                 err.message = err.message || '请求错误, statusCode: ' + httpResponse.statusCode
//
//                 if (retries) {
//                     retries = retries - 1;
//                     resolve(sendApiRequest(url, data, retries))
//                 } else {
//                     reject(err)
//                 }
//             } else {
//                 resolve(body)
//             }
//         })
//     })
// }