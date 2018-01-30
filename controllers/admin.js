'use strict'

var mongoose = require('mongoose')
var Account = mongoose.models.account
var Setting = mongoose.models.setting
var Version = mongoose.models.version
var Record = mongoose.models.record
var Models = require('../models/models.js')

var Config = require('../config.js')
var Constant = Config['Constant'] || {}
var DataDisks = Config['DataDisks'] || {}
var Mailer = require('../lib/mailer.js')
var template = require('./lib/template.js')
var ApiUtil = require('../extension/api/lib/util.js')
var md5 = require('blueimp-md5').md5
var _ = require('lodash')
var P = require('bluebird')
var Lang = require('../lang/lang.js')
var MyUtil = require('../lib/util.js')
var Memcached = require('../lib/memcached.js')
var fs = require('fs')
var XLSX = require('xlsx')
var Path = require('path')
var Moment = require('moment')

var MULTI_LOGIN = 2
var RESPONSE_JSON_FORMAT = {state: -1, message: '操作失败', data: {}}

var DEST_PATH = DataDisks['APP'] + 'data/'
var DEST_PATH = 'public/default/common/data/'

// 登录界面
exports.loginView = function (req, res, next) {
    var options = {
        // L: Lang.getFile(req.session.lang, 'admin/login'),
        layout: 'admin/layout',
        is_hide_menu: 'true',
    }
    var viewPath = 'admin/login'
    if (req.session.username && req.session.role && req.session.role >= global.ACCOUNT_ROLES.manager) {
        options.is_hide_menu = false
        viewPath = 'admin/info'
    }
    res.go(viewPath, options)
}

// 登录逻辑
exports.loginLogic = function (req, res, next) {
    var username = req.body.username
    var password = md5(req.body.password)
    var json = _.clone(RESPONSE_JSON_FORMAT, true)
    // if (!MyUtil.isEmail(username)) {
    //     json.message = '非法邮箱地址: ' + username
    //     res.send(json)
    // }
    var message = '登录异常'
    Account.Plogin(username).then(function (doc) {
        if (doc) {
            if (doc.status == global.OPERATOR_STATUS.normal) {
                if (doc.password == password) {
                    // 权限控制
                    if (doc.role < global.ACCOUNT_ROLES.manager) {
                        message = '您的权限不足 Ref: ' + doc.role
                    } else {
                        req.session.account_id = doc._id.toString()
                        req.session.city = doc.city
                        req.session.username = username
                        req.session.name = doc.name
                        for (var key in global.ACCOUNT_ROLES) {
                            if (doc.role === global.ACCOUNT_ROLES[key]) {
                                req.session[key] = true
                                req.session.role = doc.role
                                break
                            }
                        }
                        doc.sessions.push({id: req.session.id})
                        var remove = doc.sessions.length > MULTI_LOGIN ? doc.sessions[0].id : ''
                        return logoutSession(req, doc.sessions, remove)
                            .then(function () {
                                json.state = 1
                                json.message = username + ' 已登录成功'
                                json.data.redirect = '/admin/info.html'
                                res.send(json)
                            })
                    }
                } else {
                    message = '密码错误，请重新输入'
                }
            } else if (doc.status === global.OPERATOR_STATUS.unaudited) {
                message = '您的账号正在审核中，尚不可用'
            } else {
                message = '账号状态异常，请联系管理员'
            }
        } else {
            message = '用户名不存在，请重新输入'
        }
        json.message = message
        res.send(json)
    }).catch(function (err) {
        console.trace(err)
        json.message = '系统服务出了些问题，请稍后再试'
        res.send(json)
    })
}

exports.logoutLogic = function (req, res, next) {
    var sessionId = req.session.id
    var username = req.session.username

    var json = _.clone(RESPONSE_JSON_FORMAT, true)

    Account.PfindByUsername(username)
        .then(function (doc) {
            if (!doc) {
                return P.reject('用户名错误')
            }
            return logoutSession(req, doc.sessions, sessionId)
        }).then(function () {
        json.state = 1
        json.message = username + ' 已登出成功'
        json.data.redirect = '/admin/login.html'
    }).catch(function (err) {
        console.trace(err)
        json.message = '系统服务出了些问题，退出失败，请稍后再试'
    }).finally(function () {
        res.send(json)
    })
}

function logoutSession(req, sessions, logoutSessionId) {
    var remains = sessions.filter(function (session) {
        return session.id != logoutSessionId
    })
    var defer = P.defer()
    req.sessionStore.destroy(logoutSessionId, function (err, doc) {
        if (err && logoutSessionId) {
            console.trace(err)
            return defer.reject()
        }
        Account.PSaveSessionId(req.session.username, remains)
            .then(function () {
                defer.resolve()
            }).catch(function (err) {
            console.trace(err)
            defer.reject()
        })
    })
    return defer.promise
}

// 控制台
exports.indexView = function (req, res, next) {
    var options = {
        layout: 'admin/layout'
    }
    res.go('admin/index', options)
}

// 用户信息
exports.infoView = function (req, res, next) {
    var options = {
        layout: 'admin/layout'
    }
    res.go('admin/info', options)
}

// 用户管理
exports.accountListView = function (req, res, next) {
    var options = {
        layout: 'admin/layout'
    }
    res.go('admin/account/list', options)
}

// 用户编辑
exports.accountEditView = function (req, res, next) {
    var options = {
        layout: 'admin/layout'
    }
    res.go('admin/account/edit', options)
}

// 基本设置
exports.settingView = function (req, res, next) {
    var options = {
        layout: 'admin/layout'
    }

    var query = {status: {$gt: global.COMMON_STATUS.delete}}
    Version.PfindByCondition(query, {time: -1}, 0 * 99999, 99999)
        .then(function (docs) {
            _.extend(options, {versions: docs})
            return Setting.PfindOne({})
        })
        .then(function (doc) {
            _.extend(options, {versionName: doc ? doc.versionName : ''})
            res.go('admin/setting', options)
        })
}

// 设置逻辑
exports.settingLogic = function (req, res, next) {
    var versionName = req.body.versionName

    var json = _.clone(RESPONSE_JSON_FORMAT, true)

    var query = {status: {$gt: global.COMMON_STATUS.delete}}
    var options = {status: global.COMMON_STATUS.disable}
    Version.PupdateForMulti(query, options)
        .then(function (docs) {
            options = {name: versionName, status: global.COMMON_STATUS.enable}
            return Version.PaddOrUpdate(options)
        })
        .then(function (doc) {
            options = {versionName: versionName}
            return Setting.PaddOrUpdate(options)
        })
        .then(function (doc) {
            json.state = 1
            json.message = '基本配置修改成功'
        }).catch(function (err) {
        console.trace(err)
        json.message = '系统服务出了些问题，退出失败，请稍后再试'
    }).finally(function () {
        res.send(json)
    })
}

// 数据管理
exports.dataView = function (req, res, next) {
    var options = {
        layout: 'admin/layout'
    }
    res.go('admin/data', options)
}

// 数据上传
exports.dataUploadLogic = function (req, res, next) {
    var json = _.clone(RESPONSE_JSON_FORMAT, true)

    var file = req.files[0]
    var stream = fs.createReadStream(file.path)
    var filename = file.originalname
    console.log('filename>>' + filename)
    var dataType = req.body.dataType
    var inputType = req.body.inputType // overwrite: false ; additional: true
    inputType = (inputType == 'true') ? true : false
    // console.log('dataType>>' + dataType)
    // console.log('inputType>>' + inputType)

    // TODO 待处理 追加数据会覆盖本地文件
    Memcached.upload('data_upload', stream, file.originalname, true, DEST_PATH, true)
        .then(function (files) {
            // 录入用户信息 数据类型
            if (dataType == 'account') {
                if (!files || files.length <= 0) {
                    json.message = '系统服务出了些问题，请稍后再试'
                    res.send(json)
                }
                var file = files[0]
                var workbook = XLSX.readFile(file.file_name)
                var sheetNames = workbook.SheetNames
                var accountData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]])
                console.log('accountData.length:' + accountData.length)

                // TODO 待处理 此代码不够全面, 没有考虑到只覆盖某部分的情况
                // 模板数据不正确, 直接提示不应继续执行
                if (!accountData || accountData.length <= 0) {
                    return '-1'
                }

                // 用户数据 根据工号 判断是追加还是覆盖数据
                return P.map(accountData, function (data) {
                    var options = {
                        username: data['工号'],
                        password: 'ab3754565b80db0e599af0ca657ef64f',// 初始化密码:
                        name: data['姓名'],
                        tel: data['电话'],
                        city: data['地市'],
                        role: data['角色'],
                        status: data['状态']
                    }
                    // 管理员需要手动数据库插入
                    options.role = (options.role == '设计') ? global.ACCOUNT_ROLES.designer : ((options.role == '选型') ? global.ACCOUNT_ROLES.selecter : global.ACCOUNT_ROLES.locater)// other: 选址
                    options.status = (options.status == '已通过') ? global.OPERATOR_STATUS.normal : ((options.status == '已拒绝') ? global.OPERATOR_STATUS.refused : ((options.status == '待审核') ? global.OPERATOR_STATUS.unaudited : global.OPERATOR_STATUS.delete))// other: 已删除
                    return Account.PaddOrUpdate(options)
                }, {concurrency: global.MAP_CONCURRENCY.large})
            } else {// 录入方案选型信息 数据类型
                // console.log('files>>' + JSON.stringify(files))
                // files>>[{"name":"标准建设方案4.27.xlsx","file_name":"public/default/common/record/data/标准建设方案4.27.xlsx"}]
                if (!files || files.length <= 0) {
                    json.message = '系统服务出了些问题，请稍后再试'
                    res.send(json)
                }
                var file = files[0]
                var version = file.name.substring(0, file.name.lastIndexOf('.'))// 读取文件名称, 去掉文件类型
                // workbook 对象，指的是整份 Excel 文档。
                // 我们在使用 js-xlsx 读取 Excel 文档之后就会获得 workbook 对象。
                // var workbook = XLSX.readFile("public/default/common/data/record/" + version + ".xlsx")// test.xlsx
                var workbook = XLSX.readFile(file.file_name)
                console.log('workbook:' + workbook)
                // console.log('workbook str:' + JSON.stringify(workbook))
                // 获取 Excel 中所有表名
                var sheetNames = workbook.SheetNames // 返回 ['sheet1', 'sheet2']
                console.log('sheetNames:' + sheetNames)// sheetNames:系统流程及界面,Part1&Part2,Part3推荐方案(100个),Part3产品模块库(249个),Part3物资编码,Part3服务编码,设备及服务模块价格
                // 根据表名获取对应某张表, 返回对应的json数据实体
                // TODO 待处理 必须根据实际表格模板设置sheetNames 的索引
                // 选项库数据
                var optionData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[1]])
                // console.log('optionData:' + JSON.stringify(optionData))
                console.log('optionData.length:' + optionData.length)
                // 方案库数据
                var planData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[2]])
                // console.log('planData:' + JSON.stringify(planData))
                console.log('planData.length:' + planData.length)
                // 模块库数据
                var moduleData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[3]])
                // console.log('moduleData:' + JSON.stringify(moduleData))
                console.log('moduleData.length:' + moduleData.length)
                // 物资库数据
                var materialData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[4]])
                // console.log('materialData:' + JSON.stringify(materialData))
                console.log('materialData.length:' + materialData.length)
                // 服务库数据
                var serviceData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[5]])
                // console.log('serviceData:' + JSON.stringify(serviceData))
                console.log('serviceData.length:' + serviceData.length)

                // TODO 待处理 此代码不够全面, 没有考虑到只覆盖某部分的情况
                // 目前只支持一个文件含括多个地市的方式更新
                // 模板数据不正确, 直接提示不应继续执行
                if ((!optionData || optionData.length <= 0) && (!planData || planData.length <= 0) && (!moduleData || moduleData.length <= 0) && (!materialData || materialData.length <= 0) && (!serviceData || serviceData.length <= 0)) {
                    return '-1'
                }

                return Setting.PfindOne({})
                    .then(function (doc) {
                        // 服务库数据 根据录入类型 判断是追加还是覆盖数据, 否则为新增数据
                        var query = {}
                        if (inputType) {
                            if (doc) {
                                // 追加数据时, 使用当前版本号
                                version = doc.versionName
                                // 查找一些永远不成立的状态数据, 使他无法批量删除
                                query = {status: global.COMMON_STATUS.other}
                            } else {
                                // 无版本信息时, 没有追加可言
                                inputType = false
                            }
                        }
                        return Models.initServiceDB(version).PdeleteForMulti(query)
                            .then(function (docs) {
                                // 倒转入库, 由小到大, 这样才能关联到对应的数据
                                return P.map(serviceData, function (data) {
                                    var options = {
                                        classCode: data['类编码'],
                                        classAssetDescription: data['类资产描述'],
                                        itemCode: data['项编码'],
                                        itemAssetDescription: data['项资产描述'],
                                        meshCode: data['目编码'],
                                        meshAssetDescription: data['目资产描述'],
                                        nodeCode: data['节编码'],
                                        nodeAssetDescription: data['节资产描述'],
                                        subClassCode: data['子类编码'],
                                        subClassAssetDescription: data['子类资产描述'],
                                        subItemCode: data['子项编码'],
                                        subItemAssetDescription: data['子项资产描述'],
                                        serviceUnit: data['计量单位'],
                                        // todo 原本为录入data['服务编码']:  但是却和module表无法对上 应该用补全后的编码
                                        serviceCode: data['补齐12位的编码'],
                                        fixedAssets: data['对应形成的固定资产'],
                                        accountingSubject: data['对应的会计科目'],
                                        businessPlatformCode: data['对应商合平台编码'],
                                        itemSpecializedClassCode: data['子专业分类编码'],
                                        itemSpecializedClassName: data['子专业分类名称'],
                                        productSpecializedClassName: data['产品专业分类名称'],
                                        price: data['单价'],
                                        rate: data['税率'],
                                        safetyProductionCosts: data['服务模块中安全生产费（元）'],
                                        standardPrice: data['基准价(不含增值税/元)'],
                                        workContent: data['工作内容'],
                                        revision: data['修订情况']
                                    }
                                    return Models.initServiceDB(version).PaddOrUpdate(options)
                                }, {concurrency: global.MAP_CONCURRENCY.large})
                            })
                    })
                    .then(function (docs) {
                        // 物资库数据 根据录入类型 判断是追加还是覆盖数据, 否则为新增数据
                        var query = {}
                        if (inputType) {
                            // 查找一些永远不成立的状态数据, 使他无法批量删除
                            query = {status: global.COMMON_STATUS.other}
                        }
                        return Models.initMaterialDB(version).PdeleteForMulti(query)
                            .then(function (docs) {
                                return P.map(materialData, function (data) {
                                    var options = {
                                        classCode: data['类编码'],
                                        classAssetDescription: data['类描述'],
                                        itemCode: data['项编码'],
                                        itemAssetDescription: data['项描述'],
                                        meshCode: data['目编码'],
                                        meshAssetDescription: data['目描述'],
                                        nodeCode: data['节编码'],
                                        nodeAssetDescription: data['节资产描述'],
                                        subClassCode: data['子类编码'],
                                        subClassAssetDescription: data['子类资产描述'],
                                        subItemCode: data['子项编码'],
                                        subItemAssetDescription: data['子项资产描述'],
                                        subMeshCode: data['子目编码'],
                                        subMeshAssetDescription: data['子目资产描述'],
                                        materialUnit: data['计量单位'],
                                        // todo 原本为录入data['服务编码']:  但是却和module表无法对上 应该用补全后的编码
                                        materialCode: data['补齐14位的编码'],
                                        fixedAssets: data['对应形成的固定资产'],
                                        accountingSubject: data['对应的会计科目'],
                                        businessPlatformCode: data['对应商合平台编码'],
                                        itemSpecializedClassCode: data['子专业分类编码'],
                                        itemSpecializedClassName: data['子专业分类名称'],
                                        productSpecializedClassName: data['产品专业分类名称'],
                                        price: data['单价'],
                                        rate: data['税率'],
                                        towerStandardLevel: data['铁塔标准化级别'],
                                        revision: data['修订情况']
                                    }
                                    return Models.initMaterialDB(version).PaddOrUpdate(options)
                                }, {concurrency: global.MAP_CONCURRENCY.large})
                            })
                    })
                    .then(function (docs) {
                        // 模块库数据 根据录入类型 判断是追加还是覆盖数据, 否则为新增数据
                        var query = {}
                        if (inputType) {
                            // 查找一些永远不成立的状态数据, 使他无法批量删除
                            query = {status: global.COMMON_STATUS.other}
                        }
                        return Models.initModuleDB(version).PdeleteForMulti(query)
                            .then(function (docs) {
                                return P.map(moduleData, function (data) {
                                    // 找出对应的单价和税率插入到模块数据中
                                    return Models.initMaterialDB(version).PfindOne({materialCode: data['物资编码'], status: global.COMMON_STATUS.enable})
                                        .then(function (material) {
                                            return Models.initServiceDB(version).PfindOne({serviceCode:data['服务编码'], status: global.COMMON_STATUS.enable})
                                                .then(function (service) {
                                                    var options = {
                                                        provincialBranch: data['省分'],
                                                        productCode: data['产品编码(64字以内)'],
                                                        productName: data['产品名称(64字以内)'],
                                                        productDescription: data['产品描述(200字以内)'],
                                                        productProfessional: data['产品专业'],
                                                        materialCode: data['物资编码'],
                                                        materialPrice: material ? material.price : '',
                                                        materialRate: material ? material.rate : '',
                                                        materialCount: data['物资数量'],
                                                        serviceCode: data['服务编码'],
                                                        servicePrice: service ? service.price : '',
                                                        serviceRate: service ? service.rate : '',
                                                        serviceCount: data['服务数量'],
                                                        // 计量单位 也是来自对应的模块库
                                                        // materialUnit: data['计量单位'],
                                                        // serviceUnit: data['计量单位'],
                                                        materialUnit: material ? (material.materialUnit ? material.materialUnit : '') : '',
                                                        serviceUnit: service ? (service.serviceUnit ? service.serviceUnit : '') : '',
                                                        // 客户要求修改为: 那么模块库不用填写, 模板删除此列“物资说明” 和 “服务说明”
                                                        // 铁塔物资说明和服务说明变更为对应库内描述的连接。
                                                        // 如：基础设施-地面塔-普通地面塔-角钢塔-45米-风压0.65-四层平台5米间距
                                                        // materialDescription: data['物资说明'],
                                                        // serviceDescription: data['服务说明'],
                                                        materialDescription: material ? ((material.classAssetDescription ? material.classAssetDescription : '')
                                                        +  (material.itemAssetDescription ?'-' + material.itemAssetDescription : '')
                                                        +  (material.meshAssetDescription ? '-' +material.meshAssetDescription : '')
                                                        +  (material.nodeAssetDescription ? '-' +material.nodeAssetDescription : '')
                                                        +  (material.subClassAssetDescription ?'-' + material.subClassAssetDescription : '')
                                                        +  (material.subItemAssetDescription ? '-' +material.subItemAssetDescription : '')
                                                        +  (material.subMeshAssetDescription ? '-' +material.subMeshAssetDescription : '')) : '',
                                                        serviceDescription: service ? ((service.classAssetDescription ? service.classAssetDescription : '') +
                                                         (service.itemAssetDescription ? '-' +service.itemAssetDescription : '') +
                                                        (service.meshAssetDescription ? '-' + service.meshAssetDescription : '') +
                                                         (service.nodeAssetDescription ? '-' +service.nodeAssetDescription : '') +
                                                        (service.subClassAssetDescription ? '-' + service.subClassAssetDescription : '') +
                                                        (service.subItemAssetDescription ? '-' + service.subItemAssetDescription : '')) : '',
                                                        remark: data['备注']
                                                    }
                                                    return Models.initModuleDB(version).PaddOrUpdate(options)
                                                })
                                        })
                                }, {concurrency: global.MAP_CONCURRENCY.large})
                            })
                    })
                    .then(function (docs) {
                        // 方案库数据 根据录入类型 判断是追加还是覆盖数据, 否则为新增数据
                        var query = {}
                        if (inputType) {
                            // 查找一些永远不成立的状态数据, 使他无法批量删除
                            query = {status: global.COMMON_STATUS.other}
                        }
                        return Models.initPlanDB(version).PdeleteForMulti(query)
                            .then(function (docs) {
                                return P.map(planData, function (data) {
                                    var options = {
                                        city: data['地市'],
                                        county: data['区县'],
                                        code: data['编号（与城区、农村sheet对应）'],
                                        provincialBranch: data['省分'],
                                        recommendPlanCode: data['推荐方案编码（64字以内）'],
                                        recommendPlanName: data['推荐方案名称（64字以内）'],
                                        recommendPlanDescription: data['方案描述（200字以内）'],
                                        towerProfessionalProducts: data['铁塔专业产品'],
                                        towerFootProfessionalProducts: data['塔基专业产品'],
                                        computerProfessionalProducts: data['机房专业产品'],
                                        powerSupportProfessionalProducts: data['动力配套专业产品'],
                                        otherProfessionalProducts: data['其它专业产品'],
                                        electricProfessionalProducts: data['外电专业产品'],
                                        state: data['状态'],
                                        reason: data['原因'],
                                        aBa: data['阿坝'],
                                        baZhong: data['巴中'],
                                        chengDu: data['成都'],
                                        daZhou: data['达州'],
                                        deYang: data['德阳'],
                                        ganZi: data['甘孜'],
                                        guangAn: data['广安'],
                                        guangYuan: data['广元'],
                                        leShan: data['乐山'],
                                        liangShan: data['凉山'],
                                        luZhou: data['泸州'],
                                        meiShan: data['眉山'],
                                        mianYang: data['绵阳'],
                                        nanChong: data['南充'],
                                        neiJiang: data['内江'],
                                        panZhiHua: data['攀枝花'],
                                        suiNing: data['遂宁'],
                                        yaAn: data['雅安'],
                                        yiBin: data['宜宾'],
                                        ziYang: data['资阳'],
                                        ziGong: data['自贡']
                                    }
                                    return Models.initPlanDB(version).PaddOrUpdate(options)
                                }, {concurrency: global.MAP_CONCURRENCY.large})
                            })
                    })
                    .then(function (docs) {
                        // 选项库数据 根据录入类型 判断是追加还是覆盖数据, 否则为新增数据
                        var query = {}
                        if (inputType) {
                            // 查找一些永远不成立的状态数据, 使他无法批量删除
                            query = {status: global.COMMON_STATUS.other}
                        }
                        return Models.initOptionDB(version).PdeleteForMulti(query)
                            .then(function (docs) {
                                return P.map(optionData, function (data) {
                                    var options = {
                                        city: data['地市'],
                                        county: data['区县'],
                                        applyScene: data['应用场景'],
                                        constructionType: data['建设类型'],
                                        isBeautify: data['是否美化'],
                                        antennaHeight: data['天线挂高'],
                                        buildInformation: data['共建信息'],
                                        needMachine: data['是否需大型机械进场'],
                                        tower: data['铁塔'],
                                        room: data['机房'],
                                        suit: data['配套'],
                                        output: data['输出'],
                                        towerCost: data['铁塔成本'],
                                        roomCost: data['机房成本'],
                                        suitCost: data['配套成本'],
                                        totalCost: data['实际建设成本合计'],
                                        totalPrice: data['标准建设成本'],
                                        differenceRate: data['造价综合差异率*100（单位%）'],
                                        investmentRent: data['百元投资租金/年（单位元）'],
                                        correspondingNumber1: data['对应编号1'],
                                        correspondingNumber2: data['对应编号2'],
                                        correspondingNumber3: data['对应编号3'],
                                        correspondingNumber4: data['对应编号4'],
                                        towerShareSum: data['铁塔共享折扣累计'],
                                        towerNormalPrice: data['铁塔基准价格（元/年）（不含税）'],
                                        machineRoomPrice: data['机房及配套基准价格（元/年）（不含税）'],
                                        upkeep: data['维护费（元/年）'],
                                        profit: data['毛利率'],
                                        electric: data["电力费年成本（单位元）预估"],
                                        site: data["场租费年成本（单位元）预估"]
                                    }
                                    console.log('options>>' + JSON.stringify(options))
                                    return Models.initOptionDB(version).PaddOrUpdate(options)
                                }, {concurrency: global.MAP_CONCURRENCY.large})
                            })
                    })
                    .then(function (docs) {
                        return Setting.PcountByCondition({})
                    })
                    .then(function (total) {
                        // 追加数据到当前的版本中, 所以无需插入版本信息
                        if (!inputType) {
                            // 无数据时, 添加默认版本
                            if (total <= 0) {
                                var options = {
                                    versionName: version
                                }
                                return Setting.PaddOrUpdate(options)
                            }
                        }
                        return undefined
                    })
                    .then(function (doc) {
                        // 追加数据到当前的版本中, 所以无需插入版本信息
                        if (!inputType) {
                            var options = {
                                name: version
                            }
                            // 无数据时, 添加默认版本
                            if (doc) {
                                _.extend(options, {status: global.COMMON_STATUS.enable})
                            }
                            return Version.PaddOrUpdate(options)
                        }
                        return undefined
                    })
            }
        })
        .then(function (doc) {
            if (doc == -1) {
                json.message = '上传文件模板有误, 同步数据失败'
            } else {
                json.state = 1
                json.message = '上传文件同步数据成功'
                json.data = {
                    version: filename.substring(0, filename.lastIndexOf('.'))
                }
            }
            res.send(json)
        })
        .catch(function (err) {
            console.trace(err)
            json.message = '系统服务出了些问题，请稍后再试'
            res.send(json)
        })
}

// // 数据导出
// exports.dataExportLogic1 = function (req, res, next) {
//     var folderPath = 'public/default/common/data/record/20170506205413'
//     var fileName = '方案记录_20170506205413.zip'
//     var destPath = 'public/default/common/data/record/'
//     MyUtil.zip(folderPath, fileName, destPath)
// }

// 数据导出
exports.dataExportLogic = function (req, res, next) {
    // var recordId = req.query.recordId
    var page = parseInt(req.query.page, 10)
    var limit = parseInt(req.query.limit, 10)
    page = isNaN(page) || page < 0 ? 0 : page
    limit = isNaN(limit) || limit <= 0 ? 20 : limit
    var sort = JSON.parse(req.query.sort || '{"_id": 1}')

    var options = {
        layout: 'admin/layout'
    }

    // 数据预处理
    var records = undefined
    var folderPath = undefined
    var folderName = undefined
    var fileName = undefined
    var destPath = undefined
    var query = {
        // _id: recordId,
        // $lt: dateE ? Moment(dateE, 'YYYY-MM-DD').endOf('day')._d : date.clone().endOf('day')._d
        // , $gte: dateS ? Moment(dateS, 'YYYY-MM-DD').startOf('day')._d : date.clone().startOf('day')._d
        status: {$gt: global.COMMON_STATUS.delete}
    }
    Record.PfindByCondition(query, sort, page * limit, limit)
        .then(function (docs) {
            // console.log('docs>>' + JSON.stringify(docs))
            // 数据预处理
            records = docs
            if (records) {
                return P.map(records, function (record, i) {
                    record.status = record.status == 0 ? '已选址' : (record.status == 1 ? '已选型' : (record.status == 2 ? '已设计' : '其他'))
                    record.time = MyUtil.formatDateTime(record.time)
                    if (record.optionList) {
                        record.optionList.forEach(function (option, o) {
                            // 目前已选址的会只显示最优方案
                            if (option.status == global.COMMON_STATUS.enable) {
                                record.applyScene = option.applyScene
                                record.constructionType = option.constructionType
                                record.isBeautify = option.isBeautify
                                record.antennaHeight = option.antennaHeight
                                record.buildInformation = option.buildInformation
                                record.needMachine = option.needMachine
                                record.tower = option.tower
                                record.room = option.room
                                record.suit = option.suit
                                record.output = option.output
                                record.towerCost = option.towerCost
                                record.roomCost = option.roomCost
                                record.suitCost = option.suitCost
                                record.totalCost = option.totalCost
                                record.totalPrice = option.totalPrice
                                record.differenceRate = option.differenceRate
                                record.investmentRent = option.investmentRent
                                // 方案信息
                                option.planList.forEach(function (plan, o) {
                                    plan.moduleList.forEach(function (module, o) {
                                        // 初始化空值
                                        module.materialCount = module.materialCount ? module.materialCount : ''
                                        module.materialPrice = module.materialPrice ? module.materialPrice : ''
                                        module.materialRate = module.materialRate ? module.materialRate : ''
                                        // 计算总价（含税总价）
                                        if (module.materialCount != '' && module.materialPrice != '') {
                                            module.materialTotal = module.materialCount * module.materialPrice
                                            if (module.materialRate != '') {
                                                module.materialTotalForRate = module.materialCount * (module.materialPrice * (1 + module.materialRate))
                                            } else {
                                                module.materialTotalForRate = ''
                                            }
                                        } else {
                                            module.materialTotal = ''
                                            module.materialTotalForRate = ''
                                        }
                                    })
                                })
                                record.planList = option.planList
                            }
                        })
                    }
                    delete record.optionList
                    return Account.PfindOne({_id: record.accountId})
                        .then(function (doc) {
                            record.account = doc ? doc.username : record.accountId
                            delete record.accountId
                        })
                }, {concurrency: global.MAP_CONCURRENCY.large})
            } else {
                _.extend(options, {error: '导出方案记录文件数据失败'})
                res.go('error', options)
            }
        })
        .then(function () {
            // 创建文件夹
            // console.log('records>>' + JSON.stringify(records))
            // console.log('数据导出优化1')
            folderName = '方案记录_' + MyUtil.formatDateToString(new Date(), 'YYYYMMDDHHmmss')
            // folderName = '方案记录_' + '20170506202356'
            folderPath = DEST_PATH + 'record/' + folderName
            return MyUtil.PensureDir(folderPath)
        })
        // TODO 待处理, 不清楚为什么压缩不了此文件
        .then(function () {
            // 方案列表生成
            var templatePath = DEST_PATH + 'record/list-template.xlsx'
            var targetFilePath = folderPath + '/' + '方案列表.xlsx'
            // var _records = []
            // _.extend(_records, records)
            // _records.forEach(function (record, o) {
            //     delete record.planList
            // })
            // console.log('_records>>' + JSON.stringify(_records))
            return MyUtil.generateExcel(templatePath, records, targetFilePath)
        })
        .then(function () {
            // console.log('records>>' + JSON.stringify(records))
            // console.log('数据导出优化2')
            // 方案详细生成
            return P.map(records, function (record, i) {
                var templatePath = DEST_PATH + 'record/detail-template.xlsx'
                var targetFilePath = folderPath + '/' + '方案明细_' + record.stationName + '.xlsx'
                // console.log('record>>' + JSON.stringify(record))
                return MyUtil.generateExcel(templatePath, record, targetFilePath)
            }, {concurrency: global.MAP_CONCURRENCY.large})
        })
        .then(function () {
            // console.log('数据导出优化3')
            // 压缩本次文件, 并且移除文件夹本身, TODO 压缩包也需要定期删除
            // var folderPath = 'public/default/common/data/record/123'
            fileName = folderName + '.zip'
            destPath = DEST_PATH + 'record/'
            // console.log('folderPath>>' + folderPath)
            // console.log('fileName>>' + fileName)
            // console.log('destPath>>' + folderPath)
            return MyUtil.zip(folderPath, folderName, fileName, destPath)
        })
        .then(function () {
            MyUtil.removeFolder(folderPath)

            // 实现文件下载
            var filePath = Path.join(__dirname, '../' + destPath + fileName)
            var stats = fs.statSync(filePath)
            if (stats.isFile()) {
                res.set({
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': 'attachment; filename=' + encodeURIComponent(fileName),
                    'Content-Length': stats.size
                })
                fs.createReadStream(filePath).pipe(res)
            }
        })
        .catch(function (err) {
            console.trace(err)
            _.extend(options, {error: '系统服务出了些问题，请稍后再试'})
            res.go('error', options)
        })
}

// 记录列表
exports.recordListView = function (req, res, next) {
    var options = {
        layout: 'admin/layout'
    }
    res.go('admin/record/list', options)
}

// 记录编辑
exports.recordEditView = function (req, res, next) {
    var options = {
        layout: 'admin/layout'
    }
    res.go('admin/record/edit', options)
}