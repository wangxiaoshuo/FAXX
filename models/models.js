'use strict';

var mongoose = require('mongoose')
var fs = require('fs-extra')
var Path = require('path')
var _ = require('lodash')
var P = require('bluebird')

var Config = require('../config.js')
var Constant = Config['Constant'] || {}
var MyUtil = require('../lib/util.js')

var DBConnections = []
var CommonDBConnection = null

var OptionDBConnection = null
var PlanDBConnection = null
var ModuleDBConnection = null
var MaterialDBConnection = null
var ServiceDBConnection = null

function initDBInstance(modelsDefinePath, connection, includes, productId) {
    var files = fs.readdirSync(MyUtil.resolveRelative(__filename, modelsDefinePath))
    var models = []
    files.filter(function (file) {
        return /\.js$/.test(file)
    }).forEach(function (file) {
        models.push(file.replace(/\.js$/, ''))
    })

    models = models.filter(function (file) {
        if (includes) {
            return _.contains(includes, file)
        } else {
            return true
        }
    })

    if (productId) {
        P.resolve()
            .then(function () {
                return connection(productId)
            })
            .then(function (con) {
                models.forEach(function (model) {
                    var schema = require(Path.join(modelsDefinePath, model))()
                    con.model(model, schema)
                })
            })
    } else {
        models.forEach(function (model) {
            var schema = require(Path.join(modelsDefinePath, model))
            connection.model(model, schema)
        })
    }
}
exports.initDBInstance = initDBInstance

exports.initCommonDB = function (includes) {
    if (!CommonDBConnection) {
        mongoose.Promise = global.Promise;
        CommonDBConnection = mongoose.connect(Constant['MAIN_DB_URI'] + Constant['COMMON_DB_NAME'], {
            auth: {authdb: Constant['AUTH_DB_NAME']},
            mongos: Constant['MONGOS']
        })
        DBConnections.push(CommonDBConnection)
        initDBInstance('../models/db_common', CommonDBConnection, includes)
    }
    return CommonDBConnection
}

function getOtherDBModel(connectionFun, model, path, file) {
    var connection = connectionFun.models[model]
    if (connection) {
        return connection
    }
    var schema = require(Path.join(path, file))()
    connectionFun.model(model, schema)
    connection = connectionFun.models[model]

    return connection
}

// 选项库
function getOptionDBConnection() {
    if (!OptionDBConnection) {
        OptionDBConnection = mongoose.createConnection(Constant['MAIN_DB_URI'] + Constant['OPTION_DB_NAME'], {
            auth: {authdb: Constant['AUTH_DB_NAME']},
            mongos: Constant['MONGOS']
        })
        DBConnections.push(OptionDBConnection)
    }
    return OptionDBConnection
}
exports.initOptionDB = function (version) {
    return getOtherDBModel(getOptionDBConnection(), version, '../models/db_option', 'schema.js')
}

// 方案库
function getPlanDBConnection() {
    if (!PlanDBConnection) {
        PlanDBConnection = mongoose.createConnection(Constant['MAIN_DB_URI'] + Constant['PLAN_DB_NAME'], {
            auth: {authdb: Constant['AUTH_DB_NAME']},
            mongos: Constant['MONGOS']
        })
        DBConnections.push(PlanDBConnection)
    }
    return PlanDBConnection
}
exports.initPlanDB = function (version) {
    return getOtherDBModel(getPlanDBConnection(), version, '../models/db_plan', 'schema.js')
}

// 模块库
function getModuleDBConnection() {
    if (!ModuleDBConnection) {
        ModuleDBConnection = mongoose.createConnection(Constant['MAIN_DB_URI'] + Constant['MODULE_DB_NAME'], {
            auth: {authdb: Constant['AUTH_DB_NAME']},
            mongos: Constant['MONGOS']
        })
        DBConnections.push(ModuleDBConnection)
    }
    return ModuleDBConnection
}
exports.initModuleDB = function (version) {
    return getOtherDBModel(getModuleDBConnection(), version, '../models/db_module', 'schema.js')
}

// 物资库
function getMaterialDBConnection() {
    if (!MaterialDBConnection) {
        MaterialDBConnection = mongoose.createConnection(Constant['MAIN_DB_URI'] + Constant['MATERIAL_DB_NAME'], {
            auth: {authdb: Constant['AUTH_DB_NAME']},
            mongos: Constant['MONGOS']
        })
        DBConnections.push(MaterialDBConnection)
    }
    return MaterialDBConnection
}
exports.initMaterialDB = function (version) {
    return getOtherDBModel(getMaterialDBConnection(), version, '../models/db_material', 'schema.js')
}

// 服务库
function getServiceDBConnection() {
    if (!ServiceDBConnection) {
        ServiceDBConnection = mongoose.createConnection(Constant['MAIN_DB_URI'] + Constant['SERVICE_DB_NAME'], {
            auth: {authdb: Constant['AUTH_DB_NAME']},
            mongos: Constant['MONGOS']
        })
        DBConnections.push(ServiceDBConnection)
    }
    return ServiceDBConnection
}
exports.initServiceDB = function (version) {
    return getOtherDBModel(getServiceDBConnection(), version, '../models/db_service', 'schema.js')
}

function gracefulExit(callback) {
    var disconnect = function (db) {
        return new P(function (resolve, reject, notify) {
            db.close(function () {
                console.log('[gracefulExit] 数据库已经断开连接');
                resolve(true)
            })
        })
    }

    var promises = []
    DBConnections.forEach(function (db, idx) {
        if (db) {
            promises.push(disconnect(db))
        }
    })
    DBConnections = []

    return P.all(promises)
        .then(function () {
            callback && callback()
        })
        .catch(function (err) {
            callback && callback()
        })
}

function proExit(signal) {
    gracefulExit(function () {
        process.kill(process.pid, signal)
    })
}

exports.setupSafetyExit = function () {
    process.once('exit', gracefulExit)
        .once('SIGUSR2', function () {
            proExit('SIGUSR2')
        })
        .once('SIGINT', function () {
            proExit('SIGINT')
        })
        .once('SIGTERM', function () {
            proExit('SIGTERM')
        })
}