/**
 * Created by marco on 2017/04/27.
 * 帐号表
 */
'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var P = require('bluebird')
var _ = require('lodash')
var moment = require('moment')

var accountSchema = Schema({
    // 默认无, 关注微信公众号自动捆绑, 下次进入直接使用此帐号
    openId: {
        type: String, default: '', index: true
    },
    // 用户名或工号
    username: {
        type: String, required: true, index: true, unique: true
    },
    password: {
        type: String, required: true
    },
    // 姓名或昵称
    name: {
        type: String
    },
    tel: {
        type: String
    },
    // 地市
    city: {
        type: String, required: true, index: true
    },
    // 角色
    role: {
        type: Number, default: global.ACCOUNT_ROLES.locater, required: true, index: true
    },
    status: {
        type: Number, default: global.OPERATOR_STATUS.unaudited, index: true
    },
    randomFlag: {
        type: String
    },
    time: {
        type: Date, index: true
    },
    sessions: {
        type: Array
    }
})

require('../base/schema.js')(accountSchema)

accountSchema.statics.PaddOrUpdate = function (options, untimed) {
    var query = {username: options.username}
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

accountSchema.statics.PfindByOpenId = function (openId) {
    if (!openId) {
        return undefined
    }
    return this.PfindOne({openId: openId})
}

accountSchema.statics.PfindById = function (id) {
    return this.PfindOne({_id:id})
}

accountSchema.statics.PfindByUsername = function (username) {
    return this.PfindOne({username: username})
}

accountSchema.statics.Padd = function (options) {
    var thisModel = this
    return this.Pfind({username: options.username})
        .then(function (doc) {
            if (!doc || doc.length === 0) {
                var op = {
                    time: new Date(Date.now())
                }
                _.extend(options, op)
                return thisModel.Psave(options)
            } else {
                return P.reject(new Error('账号已经存在, 请与管理员联系'))
            }
        })
}

accountSchema.statics.Plogin = function (username) {
    return this.PfindOne({username : username})
}

accountSchema.statics.PsetPwdResetting = function (username, randomFlag) {
    var thisModel = this
    return this.PfindByUsername(username).then(function (doc) {
        if (doc) {
            if (doc.status === global.OPERATOR_STATUS.unaudited) {
                return P.reject(new Error('您的账户正在审核中，不适用密码找回功能。'))
            } else {
                return thisModel.PfindOneAndUpdate({username: username}, {$set: {randomFlag: randomFlag}})
            }
        } else {
            return P.reject(new Error('您输入的账户不存在。'))
        }
    })
}

accountSchema.statics.PsetPwd = function (username, password, newPassword) {
    return this.PfindOneAndUpdate({username: username, password: password}, {$set: {password: newPassword}})
}

accountSchema.statics.PsetAccount = function (username, name, tel) {
    return this.PfindOneAndUpdate({username: username},
        {$set: { name: name, tel: tel}})
}

accountSchema.statics.PresetPassword = function (username, randomFlag, newPassword) {
    // 重置randomFlag使得邮件设置密码的链接无效
    return this.PfindOneAndUpdate({username: username, randomFlag: randomFlag},
        {$set: {password: newPassword, randomFlag: Math.random(), status: global.OPERATOR_STATUS.normal}})
}

accountSchema.statics.PSaveSessionId = function (username, sessions) {
    return this.PfindOneAndUpdate({username: username}, {$set: {sessions: sessions}})
}

accountSchema.statics.PfindForAudit = function (query, skip, limit) {
    var thisModel = this
        , total = 0
    // 返回不包含软删除的记录
    // _.extend(query, {status: {$gt: global.OPERATOR_STATUS.delete}})
    return thisModel.Pcount(query).then(function (count) {
            total = count
            return thisModel.Pfind(query, {time: -1}, skip, limit)
        }).then(function (docs) {
            docs.total = total
            return P.resolve(docs)
        })
}


accountSchema.statics.PsetAudit = function (username, status) {
    var update = {$set: {}}
    update.$set = {status : status}
    return this.PfindOneAndUpdate({username: username}, update)
}

accountSchema.statics.Pdelete = function (id) {
    return this.PfindOneAndUpdate({_id: id},{$set: {status: global.COMMON_STATUS.delete}})
}

accountSchema.statics.PdeleteForMulti = function (query) {
    // 记录时间
    var options = {status: global.COMMON_STATUS.delete}
    var op = {
        time: new Date(Date.now())
    }
    _.extend(options, op)
    return this.Pupdate(query, {$set: options}, {multi: true})
}

accountSchema.statics.Pupdate = function (id, options) {
    return this.PfindOneAndUpdate({_id: id}, {$set: options})
}

accountSchema.statics.PupdateForMulti = function (query, options) {
    return this.Pupdate(query, {$set: options}, {multi: true})
}

accountSchema.statics.PcountByCondition = function (query) {
    // 返回不包含软删除的记录
    if (!query.hasOwnProperty('status')) {
        _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
    }
    return this.Pcount(query)
}

accountSchema.statics.PfindByCondition = function (query, sort, skip, limit, projection) {
    // 返回不包含软删除的记录
    if (!query.hasOwnProperty('status')) {
        _.extend(query, {status: {$gt: global.COMMON_STATUS.delete}})
    }
    return this.Pfind(query, sort, skip, limit, projection)
}

module.exports = accountSchema