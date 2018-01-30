'use strict';

var P = require('bluebird')
var _ = require('lodash')
var mongoose = require('mongoose')
var ApiTask = mongoose.models.apiTask

var Models = require('../models/models.js')
var ApiUtil = require('../extension/api/lib/util.js')

var CachedTrains = {}
var CachedContexts = {}

function deleteCache(cache, now, liveTime) {
    for (var key in cache) {
        var time = cache[key].time
        if ((now - time ) > liveTime) {
            delete cache[key]
        }
    }
}

(function manageCachedKeys() {
    var now = (new Date()).getTime()

    deleteCache(CachedTrains, now, 1000 * 60 * 59)
    deleteCache(CachedContexts, now, 1000 * 60 * 59)

    setTimeout(manageCachedKeys, 1000 * 60 * 60)
}())


function parseThresholds(thresholds) {
    var rets = []
    if (_.isArray(thresholds)) {
        thresholds.forEach(function (threshold) {
            rets.push(threshold / 100)
        })
    }
    return rets
}

var getApiTasker = function (taskId) {
    return ApiTask.PgetActiveById(taskId)
        .then(function (tasks) {
            var classifiedTasks = taskClassifier(tasks)
            if (!classifiedTasks.uCount) {
                return ApiUtil.responseFail(global.API_RESPONSE_CODE.unauth, '没有找到有效的配置任务')
            }
            return P.resolve(classifiedTasks)
        }).catch(function (err) {
            console.trace(err)
            return ApiUtil.responseFail(err.state || global.API_RESPONSE_CODE.unauth, 'taskId [' + taskId + '] ' + err.message)
        })
}
exports.getApiTasker = getApiTasker

function taskClassifier(tasks) {
    var ret = {tasks: [], iTasks: [], thresholds: {}, tCount: 0, uCount: 0}
    var newTasks = []

    tasks.forEach(function (task) {
        task._id = task._id.toString()
        var thresholds = parseThresholds(task.thresholds)
        if (thresholds.length) {
            ret.thresholds[task._id] = thresholds
        }

        delete task.thresholds
        delete task.time
        delete task.callback
        ret.tCount++
        newTasks.push(task)
        ret.uCount++
    })

    var obj = _.groupBy(newTasks, 'contextId')
    for (var contextId in obj) {
        var tasks = obj[contextId]
        var uTasks = tasks.filter(taskFilter)

        ret.tasks = ret.tasks.concat(uTasks)
    }
    return ret
}

function taskFilter(obj) {
    return _.includes([global.API_TASK_STATUS.normal], obj.status)
}