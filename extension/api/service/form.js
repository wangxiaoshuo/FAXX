'use strict'

var P = require('bluebird')
var mongoose = require('mongoose')
var Account = mongoose.models.account
var Setting = mongoose.models.setting
var Record = mongoose.models.record
var Log = mongoose.models.log
var Models = require('../../../models/models.js')
var _ = require('lodash')
var ApiUtil = require('../lib/util.js')
var MyUtil = require('../../../lib/util.js')

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
        case 'load':
            var version = undefined
            // 分页功能
            var total = 0
            var result = {cities: []}
            return P.resolve()
                .then(function () {
                    return Setting.PfindOne({})
                })
                .then(function (doc) {
                    version = doc ? doc.versionName : ''
                    // version = 'v20170426195805'
                    // 查找所有表单数据, eg: data={} 或者查找其他的条件对应表单数据
                    // var query = data
                    // db.getCollection('v20170426195805').aggregate({$match: { status: { '$gt': -1 } }}, {$group: {_id: { city: '$city' }, records: {$push: {_id: '$_id'}}}})
                    var query = {city: data.city}
                    var field = {city: '$city'}
                    var records = {_id: '$_id'}
                    return Models.initOptionDB(version).PgroupByCondition(query, field, records)
                })
                .then(function (cities) {
                    return P.map(cities, function (city, i) {
                        var currentCity = result.cities[i] = {}
                        currentCity.city = city['_id']['city']
                        // currentCity.cityForRecords = city['records']
                        var query = {city: currentCity.city}
                        var field = {county: "$county"}
                        var records = {_id: '$_id'}
                        return Models.initOptionDB(version).PgroupByCondition(query, field, records)
                            .then(function (counties) {
                                _.extend(currentCity, {counties: []})
                                return P.map(counties, function (county, i) {
                                    var currentCounty = currentCity.counties[i] = {}
                                    currentCounty.county = county['_id']['county']
                                    // currentCounty.countyForRecords = county['records']
                                    var query = {city: currentCity.city, county: currentCounty.county}
                                    var field = {applyScene: "$applyScene"}
                                    var records = {_id: '$_id'}
                                    return Models.initOptionDB(version).PgroupByCondition(query, field, records)
                                        .then(function (applyScenes) {
                                            _.extend(currentCounty, {applyScenes: []})
                                            return P.map(applyScenes, function (applyScene, i) {
                                                var currentApplyScene = currentCounty.applyScenes[i] = {}
                                                currentApplyScene.applyScene = applyScene['_id']['applyScene']
                                                // currentApplyScene.applySceneForRecords = applyScene['records']
                                                var query = {
                                                    city: currentCity.city,
                                                    county: currentCounty.county,
                                                    applyScene: currentApplyScene.applyScene
                                                }
                                                var field = {constructionType: "$constructionType"}
                                                var records = {_id: '$_id'}
                                                return Models.initOptionDB(version).PgroupByCondition(query, field, records)
                                                    .then(function (constructionTypes) {
                                                        _.extend(currentApplyScene, {constructionTypes: []})
                                                        return P.map(constructionTypes, function (constructionType, i) {
                                                            var currentConstructionType = currentApplyScene.constructionTypes[i] = {}
                                                            currentConstructionType.constructionType = constructionType['_id']['constructionType']
                                                            // currentConstructionType.constructionTypeForRecords = constructionType['records']
                                                            var query = {
                                                                city: currentCity.city,
                                                                county: currentCounty.county,
                                                                applyScene: currentApplyScene.applyScene,
                                                                constructionType: currentConstructionType.constructionType
                                                            }
                                                            var field = {isBeautify: "$isBeautify"}
                                                            var records = {_id: '$_id'}
                                                            return Models.initOptionDB(version).PgroupByCondition(query, field, records)
                                                                .then(function (isBeautifies) {
                                                                    _.extend(currentConstructionType, {isBeautifies: []})
                                                                    return P.map(isBeautifies, function (isBeautify, i) {
                                                                        var currentIsBeautify = currentConstructionType.isBeautifies[i] = {}
                                                                        currentIsBeautify.isBeautify = isBeautify['_id']['isBeautify']
                                                                        // currentIsBeautify.isBeautifyForRecords = isBeautify['records']
                                                                        var query = {
                                                                            city: currentCity.city,
                                                                            county: currentCounty.county,
                                                                            applyScene: currentApplyScene.applyScene,
                                                                            constructionType: currentConstructionType.constructionType,
                                                                            isBeautify: currentIsBeautify.isBeautify
                                                                        }
                                                                        var field = {antennaHeight: "$antennaHeight"}
                                                                        var records = {_id: '$_id'}
                                                                        return Models.initOptionDB(version).PgroupByCondition(query, field, records)
                                                                            .then(function (antennaHeights) {
                                                                                _.extend(currentIsBeautify, {antennaHeights: []})
                                                                                return P.map(antennaHeights, function (antennaHeight, i) {
                                                                                    var currentAntennaHeight = currentIsBeautify.antennaHeights[i] = {}
                                                                                    currentAntennaHeight.antennaHeight = antennaHeight['_id']['antennaHeight']
                                                                                    // currentAntennaHeight.antennaHeightForRecords = antennaHeight['records']
                                                                                    var query = {
                                                                                        city: currentCity.city,
                                                                                        county: currentCounty.county,
                                                                                        applyScene: currentApplyScene.applyScene,
                                                                                        constructionType: currentConstructionType.constructionType,
                                                                                        isBeautify: currentIsBeautify.isBeautify,
                                                                                        antennaHeight: currentAntennaHeight.antennaHeight
                                                                                    }
                                                                                    var field = {buildInformation: "$buildInformation"}
                                                                                    var records = {_id: '$_id'}
                                                                                    return Models.initOptionDB(version).PgroupByCondition(query, field, records)
                                                                                        .then(function (buildInformations) {
                                                                                            _.extend(currentAntennaHeight, {buildInformations: []})
                                                                                            return P.map(buildInformations, function (buildInformation, i) {
                                                                                                var currentBuildInformation = currentAntennaHeight.buildInformations[i] = {}
                                                                                                currentBuildInformation.buildInformation = buildInformation['_id']['buildInformation']
                                                                                                currentBuildInformation.buildInformationForRecords = buildInformation['records']
                                                                                                var query = {
                                                                                                    city: currentCity.city,
                                                                                                    county: currentCounty.county,
                                                                                                    applyScene: currentApplyScene.applyScene,
                                                                                                    constructionType: currentConstructionType.constructionType,
                                                                                                    isBeautify: currentIsBeautify.isBeautify,
                                                                                                    antennaHeight: currentAntennaHeight.antennaHeight,
                                                                                                    buildInformation: currentBuildInformation.buildInformation
                                                                                                }
                                                                                                var field = {needMachine: "$needMachine"}
                                                                                                var records = {_id: '$_id'}
                                                                                                return Models.initOptionDB(version).PgroupByCondition(query, field, records)
                                                                                                    .then(function (needMachines){
                                                                                                        _.extend(currentBuildInformation,{needMachines:[]})
                                                                                                        return P.map(needMachines,function (needMachine,i) {
                                                                                                            var currentNeedMachine = currentBuildInformation.needMachines[i] = {}
                                                                                                            currentNeedMachine.needMachine = needMachine['_id']['needMachine']
                                                                                                            currentNeedMachine.machineForRecords = needMachine['records']

                                                                                                            var query = {
                                                                                                                city: currentCity.city,
                                                                                                                county: currentCounty.county,
                                                                                                                applyScene: currentApplyScene.applyScene,
                                                                                                                constructionType: currentConstructionType.constructionType,
                                                                                                                isBeautify: currentIsBeautify.isBeautify,
                                                                                                                antennaHeight: currentAntennaHeight.antennaHeight,
                                                                                                                buildInformation: currentBuildInformation.buildInformation,
                                                                                                                needMachine: currentNeedMachine.needMachine
                                                                                                            }

                                                                                                            var field = {tower: "$tower"}
                                                                                                            var records = {_id: '$_id'}
                                                                                                            return Models.initOptionDB(version).PgroupByCondition(query, field, records)
                                                                                                                .then(function (towers) {
                                                                                                                    _.extend(currentNeedMachine, {towers: []})
                                                                                                                    return P.map(towers, function (tower, i) {
                                                                                                                        var currentTower = currentNeedMachine.towers[i] = {}
                                                                                                                        currentTower.tower = tower['_id']['tower']
                                                                                                                        currentTower.towerForRecords = tower['records']
                                                                                                                        var query = {
                                                                                                                            city: currentCity.city,
                                                                                                                            county: currentCounty.county,
                                                                                                                            applyScene: currentApplyScene.applyScene,
                                                                                                                            constructionType: currentConstructionType.constructionType,
                                                                                                                            isBeautify: currentIsBeautify.isBeautify,
                                                                                                                            antennaHeight: currentAntennaHeight.antennaHeight,
                                                                                                                            buildInformation: currentBuildInformation.buildInformation,
                                                                                                                            needMachine: currentNeedMachine.needMachine,
                                                                                                                            tower: currentTower.tower
                                                                                                                        }
                                                                                                                        var field = {room: "$room"}
                                                                                                                        var records = {_id: '$_id'}
                                                                                                                        return Models.initOptionDB(version).PgroupByCondition(query, field, records)
                                                                                                                            .then(function (rooms) {
                                                                                                                                _.extend(currentTower, {rooms: []})
                                                                                                                                return P.map(rooms, function (room, i) {
                                                                                                                                    var currentRoom = currentTower.rooms[i] = {}
                                                                                                                                    currentRoom.room = room['_id']['room']
                                                                                                                                    currentRoom.roomForRecords = room['records']
                                                                                                                                    var query = {
                                                                                                                                        city: currentCity.city,
                                                                                                                                        county: currentCounty.county,
                                                                                                                                        applyScene: currentApplyScene.applyScene,
                                                                                                                                        constructionType: currentConstructionType.constructionType,
                                                                                                                                        isBeautify: currentIsBeautify.isBeautify,
                                                                                                                                        antennaHeight: currentAntennaHeight.antennaHeight,
                                                                                                                                        buildInformation: currentBuildInformation.buildInformation,
                                                                                                                                        needMachine: currentNeedMachine.needMachine,
                                                                                                                                        tower: currentTower.tower,
                                                                                                                                        room: currentRoom.room
                                                                                                                                    }
                                                                                                                                    var field = {suit: "$suit"}
                                                                                                                                    var records = {_id: '$_id'}
                                                                                                                                    return Models.initOptionDB(version).PgroupByCondition(query, field, records)
                                                                                                                                        .then(function (suits) {
                                                                                                                                            _.extend(currentRoom, {suits: []})
                                                                                                                                            return P.map(suits, function (suit, i) {
                                                                                                                                                var currentSuit = currentRoom.suits[i] = {}
                                                                                                                                                currentSuit.suit = suit['_id']['suit']
                                                                                                                                                currentSuit.suitForRecords = suit['records']
                                                                                                                                                // var query = {city: currentCity.city, county: currentCounty.county, applyScene: currentApplyScene.applyScene, constructionType: currentConstructionType.constructionType, isBeautify: currentIsBeautify.isBeautify, antennaHeight: currentAntennaHeight.antennaHeight, buildInformation: currentBuildInformation.buildInformation, tower: currentTower.tower, room: currentRoom.room, suit: currentSuit.suit}
                                                                                                                                                // var field = {output: "$output"}
                                                                                                                                                // var records = {_id: '$_id'}
                                                                                                                                                // return Models.initOptionDB(version).PgroupByCondition(query, field, records)
                                                                                                                                            }, {concurrency: global.MAP_CONCURRENCY.large})
                                                                                                                                        })
                                                                                                                                }, {concurrency: global.MAP_CONCURRENCY.large})
                                                                                                                            })
                                                                                                                    }, {concurrency: global.MAP_CONCURRENCY.large})
                                                                                                                })
                                                                                                        }, {concurrency: global.MAP_CONCURRENCY.large})
                                                                                                    })
                                                                                            }, {concurrency: global.MAP_CONCURRENCY.large})
                                                                                        })
                                                                                }, {concurrency: global.MAP_CONCURRENCY.large})
                                                                            })
                                                                    }, {concurrency: global.MAP_CONCURRENCY.large})
                                                                })
                                                        }, {concurrency: global.MAP_CONCURRENCY.large})
                                                    })
                                            }, {concurrency: global.MAP_CONCURRENCY.large})
                                        })
                                }, {concurrency: global.MAP_CONCURRENCY.large})
                            })
                    }, {concurrency: global.MAP_CONCURRENCY.large})
                })
                .then(function () {
                    json = ApiUtil.response(1, '表单数据查找成功', result)
                }).catch(function (err) {
                    console.error(err)
                    json = ApiUtil.response(-2, err.message)
                })
                .finally(function () {
                    res.send(json)
                })
            break
        case 'find':// 根据已选的字段值, 按权重70% 和 30%返回3条具体方案实体
            // 空数组必须转为空对象, 否则无法正常使用数据脚本, 如: 添加status字段
            if (data && data.length == [].length) {
                data = {}
            }
            var version = undefined
            // 分页功能
            var total = 0
            return P.resolve()
                .then(function () {
                    return Setting.PfindOne({})
                })
                .then(function (doc) {
                    version = doc ? doc.versionName : ''
                    // version = 'v20170426195805'
                    if (data.length > 0) {// 根据选项_id查找对应选项, eg: data=["5901f75125863e586c9fe4e6", "5901f75125863e586c9fe4e8"]
                        var query = {_id: {"$in": data}}
                        return Models.initOptionDB(version).PcountByCondition(query)
                            .then(function (count) {
                                total = count
                                return Models.initOptionDB(version).PfindByCondition(query, sort, page * limit, limit)
                            })
                    } else {// 查找所有选项, eg: data={} 或者查找其他的条件对应选项
                        var query = data
                        return Models.initOptionDB(version).PcountByCondition(query)
                            .then(function (count) {
                                total = count
                                return Models.initOptionDB(version).PfindByCondition(query, sort, page * limit, limit)
                            })
                    }
                })
                .then(function (docs) {
                    // 算法排序
                    docs = MyUtil.sortArray(docs, 'differenceRate', 0.7, 'investmentRent', 0.3)
                    json = ApiUtil.response(1, '选项查找成功', docs, total)
                }).catch(function (err) {
                    console.error(err)
                    json = ApiUtil.response(-2, err.message)
                })
                .finally(function () {
                    res.send(json)
                })
            break
        case 'save':
            // 提交_id和status参数值, 保存字段值能够保证记录的存档
            // 支持修改方案
            var optionList = []
            var isDesign = data.isDesign

            // 第一步: 读取指定的版本信息
            var version = undefined
            return P.resolve()
                .then(function () {
                    return Setting.PfindOne({})
                })
                .then(function (doc) {
                    version = doc.versionName
                    // 第二步: 非设计保存, 那么添加新添加的方案列表
                    if (!isDesign) {
                        return P.map(data.optionList, function (item, index) {
                            var _item = item
                            var _id = _item._id
                            var option = undefined
                            return Models.initOptionDB(version).PfindOne({_id: _id})
                                .then(function (doc) {
                                    option = doc
                                    // 关联选型ID到记录表
                                    option.optionId = doc._id.toString()
                                    // 初始化选型方案的状态
                                    option.status = item.status
                                    // 第三步: 捆绑关联信息
                                    var codeArr = []
                                    var correspondingNumber1 = option.correspondingNumber1
                                    if (correspondingNumber1) {
                                        codeArr.push(correspondingNumber1)
                                    }
                                    var correspondingNumber2 = option.correspondingNumber2
                                    if (correspondingNumber2) {
                                        codeArr.push(correspondingNumber2)
                                    }
                                    var correspondingNumber3 = option.correspondingNumber3
                                    if (correspondingNumber3) {
                                        codeArr.push(correspondingNumber3)
                                    }
                                    var correspondingNumber4 = option.correspondingNumber4
                                    if (correspondingNumber4) {
                                        codeArr.push(correspondingNumber4)
                                    }
                                    var query = {code: {$in: codeArr}}
                                    return Models.initPlanDB(version).PfindByCondition(query, {_id: 1}, 0 * 99999, 99999)
                                })
                                .then(function (docs) {
                                    option.planList = []
                                    return P.map(docs, function (item, index) {
                                        var plan = {
                                            recommendPlanCode: item.recommendPlanCode,
                                            recommendPlanName: item.recommendPlanName,
                                            recommendPlanDescription: item.recommendPlanDescription,
                                            moduleList: []
                                        }
                                        var productCodeArr = []
                                        var towerProfessionalProducts = item.towerProfessionalProducts
                                        if (towerProfessionalProducts) {
                                            productCodeArr.push(towerProfessionalProducts)
                                        }
                                        var towerFootProfessionalProducts = item.towerFootProfessionalProducts
                                        if (towerFootProfessionalProducts) {
                                            productCodeArr.push(towerFootProfessionalProducts)
                                        }
                                        var computerProfessionalProducts = item.computerProfessionalProducts
                                        if (computerProfessionalProducts) {
                                            productCodeArr.push(computerProfessionalProducts)
                                        }
                                        var powerSupportProfessionalProducts = item.powerSupportProfessionalProducts
                                        if (powerSupportProfessionalProducts) {
                                            productCodeArr.push(powerSupportProfessionalProducts)
                                        }
                                        var otherProfessionalProducts = item.otherProfessionalProducts
                                        if (otherProfessionalProducts) {
                                            productCodeArr.push(otherProfessionalProducts)
                                        }
                                        var electricProfessionalProducts = item.electricProfessionalProducts
                                        if (electricProfessionalProducts) {
                                            productCodeArr.push(electricProfessionalProducts)
                                        }
                                        var query = {productCode: {$in: productCodeArr}}
                                        return Models.initModuleDB(version).PfindByCondition(query, {_id: 1}, 0 * 99999, 99999)
                                            .then(function (docs) {
                                                return P.map(docs, function (item, index) {
                                                    var module = {
                                                        materialCode: item.materialCode,
                                                        materialPrice: item.materialPrice,
                                                        materialRate: item.materialRate,
                                                        materialCount: item.materialCount,
                                                        materialUnit: item.materialUnit,
                                                        materialDescription: item.materialDescription,

                                                        serviceCode: item.serviceCode,
                                                        servicePrice: item.servicePrice,
                                                        serviceRate: item.serviceRate,
                                                        serviceCount: item.serviceCount,
                                                        serviceUnit: item.serviceUnit,
                                                        serviceDescription: item.serviceDescription
                                                    }
                                                    plan.moduleList.push(module)
                                                }, {concurrency: global.MAP_CONCURRENCY.large})
                                            })
                                            .then(function (docs) {
                                                option.planList.push(plan)
                                            })
                                    }, {concurrency: global.MAP_CONCURRENCY.large})
                                })
                                .then(function (docs) {
                                    return option
                                })
                        }, {concurrency: global.MAP_CONCURRENCY.large})
                            .then(function (options) {
                                optionList = options
                            })
                    }
                })
                .then(function () {
                    // 第四步: 非设计保存, 那么更新的方案记录
                    if (!isDesign) {
                        var options = {
                            accountId: data.accountId,
                            stationName: data.stationName,
                            province: data.province,
                            city: data.city,
                            county: data.county,
                            address: data.address,
                            longitude: data.longitude,
                            latitude: data.latitude,
                            optionList: optionList,// 覆盖已存在的方案列表
                            status: data.status
                        }
                        // 含_id为修改
                        if (data.recordId) {
                            _.extend(options, {_id: data.recordId})
                        }
                        return Record.PaddOrUpdate(options)
                    } else {
                        // 第[二]步: 设计保存逻辑, 那么更新的方案设计模块
                        var options = {}
                        _.extend(options, data)
                        delete options.isDesign
                        return Record.PaddOrUpdate(options)
                    }
                })
                .then(function (doc) {
                    json = ApiUtil.response(1, '方案保存成功', doc)
                })
                .catch(function (err) {
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