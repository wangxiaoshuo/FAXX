'use strict';

var mongoose = require('mongoose')
var Record = mongoose.models.record
var Account = mongoose.models.account

var http = require("http");
var https = require("https");
var sha1 = require("sha1")
var _ = require('lodash')
var Config = require('../config.js')
var Constant = Config['Constant'] || {}
var DataDisks = Config['DataDisks'] || {}
var Mailer = require('../lib/mailer.js')
var template = require('./lib/template.js')
var ApiUtil = require('../extension/api/lib/util.js')
var MyUtil = require('../lib/util.js')
var md5 = require('blueimp-md5').md5
var P = require('bluebird')
var WechatOauth = require('wechat-oauth')
var WechatAPI = require('wechat-api');
var api = new WechatAPI(global.WEIXIN_APPID, global.WEIXIN_APPSECRET);
var moment = require("moment")
moment.locale('zh-cn')

var Lang = require('../lang/lang.js')

var MULTI_LOGIN = 1
var RESPONSE_JSON_FORMAT = {state: -1, message: '操作失败', data: {}}

  /*  // 随机字符串产生函数
    var createNonceStr = function() {
        return Math.random().toString(36).substr(2, 15);
    };

    // 时间戳产生函数
    var createTimeStamp = function () {
        return parseInt(new Date().getTime() / 1000) + '';
    };

var raw = function (args) {
    var keys = Object.keys(args);
    keys = keys.sort()
    var newArgs = {};
    keys.forEach(function (key) {
        newArgs[key.toLowerCase()] = args[key];
    });
    var string = '';
    for (var k in newArgs) {
        string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1);
    return string;
};
var errorRender = function (res, info, data) {
    if(data){
        console.log(data);
        console.log('---------');
    }
    res.set({
        "Access-Control-Allow-Origin": "*"
        ,"Access-Control-Allow-Methods": "POST,GET"
        ,"Access-Control-Allow-Credentials": "true"
    });
    responseWithJson(res, {errmsg: 'error', message: info, data: data});
};
*/

//消息推送
exports.pushMessage = function(req,res,next){
    var recordId = req.query.recordId
    var options = {}

    var query = {
        _id: recordId,
        status: {$gt: global.COMMON_STATUS.delete}
    }
    Record.PfindOne(query)
        .then(function (record) { //通过recordid获取用户账号id
            if (record) {
                console.log(record)
                var accountId = record.accountId //记录里的用户id
                var stationName = record.stationName //记录里的基站名称
                var username = req.session.username
                var city = record.city
                var id = mongoose.Types.ObjectId(accountId)
                var currentRole = req.session.role
                var data
                var currentPart
                record.actualCost = 0
                record.recordLog.push(username + " " + moment(new Date()).format('YYYY-MM-DD HH:mm:ss'))
                if(record.status === 0 && currentRole === 0){
                    record.latestUser[0] = username + '[选址员]';
                }
                if(record.status === 1 && currentRole === 1){
                    record.latestUser[1] = username + '[选型员]';
                }else if(record.status === 1 && currentRole === 2){
                    record.latestUser[2] = username + '[设计员]';
                }
                if(record.status === 2 && currentRole === 2){
                    record.latestUser[2] = username + '[设计员]';
                }
                _.extend(record, {username: username, role: currentRole})
                _.extend(options, {recordId: recordId, record: record,currentRole:currentRole})
                return Record.PaddOrUpdate(record)
                    .then(function (doc) {
                        if(currentRole < 2){
                            console.log("2222222222222")
                            return Account.PfindById(id)
                                .then(function(account){
                                    var role = account.role //原推送消息者权限
                                    var username1 = req.session.username //当前用户
                                    var username2 = account.username //原推送消息者
                                    var status = record.status
                                    if (role >= 0 && role < 2 ) {
                                        console.log("username1>>>")
                                        console.log("username2>>>>>")
                                        if(username1 === username2){
                                            role += 1
                                        }
                                        else if(username1 !== username2 && role === currentRole){
                                            role += 1
                                        }
                                        else if(username1 !== username2 && role !== currentRole){
                                            role += 2
                                        }

                                        console.log("currentPart>>>>>",currentPart)
                                        var currentPart1 = record.latestUser[status]
                                        data = {
                                            "first": {
                                                "value": "操作人员通过系统生成获取了方案",
                                                "color": "#173177"
                                            },
                                            "keyword1": {
                                                "value": stationName,
                                                "color": "#173177"
                                            },
                                            "keyword2": {
                                                "value": currentPart1,
                                                "color": "#173177"
                                            },
                                            "keyword3": {
                                                "value": moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                                                "color": "#173177"
                                            },
                                            "remark": {
                                                "value": "请登录系统查看详情",
                                                "color": "#173177"
                                            }
                                        }

                                        var sp = []
                                        var url =  "http://tieta.1g9f.com/home/selector.html?recordId="+recordId
                                        var templateId = global.WEIXIN_TEMPLATE_ID
                                        console.log("templateID>>>>>",templateId)
                                        if(currentRole == 1){
                                            url = "http://tieta.1g9f.com/home/design.html?recordId="+recordId
                                        }

                                        Account.find({"city": city, "role": role}, function (err, doc2) {
                                            if (err) {
                                                console.log(err)
                                            }
                                            else if (doc2.length > 0) {
                                                for (var i in doc2){
                                                    console.log(doc2[i].openId)
                                                    if (doc2[i].openId !== "") {
                                                        sp.push(doc2[i].openId)
                                                    }
                                                }
                                                for (var j in sp){
                                                    api.sendTemplate(sp[j], templateId, url, data, function (err, result) {
                                                        console.log("sp>>>>>",sp[0])
                                                        if (!err) {
                                                            console.log(result)
                                                        } else {
                                                            console.log(err)
                                                        }
                                                    })
                                                }
                                                res.go('home/pselector', options)
                                            }
                                        })

                                    }
                                })
                        }
                        else{
                            console.log("111111111111111111111")
                            res.go('home/pdesign', options)
                        }

                    })

                /*Account.find({"_id": id}, function (err, account) { //通过用户账号获取原推送消息者
                    if (err) {
                        console.log("account find flase")
                    }
                    else if (account.length > 0) {
                        var data
                        var role = account[0].role //原推送消息者权限
                        var currentRole
                        var currentPart
                        var username1 = req.session.username //当前用户
                        var username2 = account[0].username //原推送消息者
                        currentRole = req.session.role
                        console.log("currentRole>>>>>>>>>",currentRole)
                        /!*  console.log("username>>>>>>",username1)
                         console.log("username>>>>>>",username2)
                         console.log(role)
                         console.log(currentRole)*!/
                        Record.update(query,{$push:{recordLog:username1+" "+moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}},function(err,record){
                            if(err){console.log("update false >>>>>")}
                            else if(record){
                                console.log("update success")
                            }
                        })

                        console.log("recordLog>>>>",recordLog)
                        if (role >= 0 && role < 2 ) {
                            console.log("username1>>>")
                            console.log("username2>>>>>")
                            if(username1 === username2){
                                role += 1
                            }
                            else if(username1 !== username2 && role === currentRole){
                                role += 1
                            }
                            else if(username1 !== username2 && role !== currentRole){
                                role += 2
                            }
                        if (role === 0){
                                currentPart = "选址员"
                        }else if(role === 1){
                            currentPart = "选型员"
                        }
                        console.log("stationName>>>>>",stationName)
                            data = {
                                "first": {
                                    "value": "操作人员通过系统生成获取了方案",
                                    "color": "#173177"
                                },
                                "keyword1": {
                                    "value": stationName,
                                    "color": "#173177"
                                },
                                "keyword2": {
                                    "value": username1+'['+currentPart+']',
                                    "color": "#173177"
                                },
                                "keyword3": {
                                    "value": moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                                    "color": "#173177"
                                },
                                "remark": {
                                    "value": "请登录系统查看详情",
                                    "color": "#173177"
                                }
                            }
                            // console.log(data)
                            // console.log(role)
                            var sp = []
                            var url =  "http://tieta.1g9f.com/home/selector.html?recordId="+recordId
                            var templateId = global.WEIXIN_TEMPLATE_ID
                            console.log("templateID>>>>>",templateId)
                            if(currentRole == 1){
                                url = "http://tieta.1g9f.com/home/design.html?recordId="+recordId
                            }

                            Account.find({"city": city, "role": role}, function (err, doc2) {
                                if (err) {
                                    console.log(err)
                                }
                                else if (doc2.length > 0) {
                                    for (var i in doc2){
                                        console.log(doc2[i].openId)
                                        if (doc2[i].openId !== "") {
                                            sp.push(doc2[i].openId)
                                        }
                                    }
                                   /!* for (var j in sp){
                                        api.sendTemplate(sp[j], templateId, url, data, function (err, result) {
                                            console.log("sp>>>>>",sp[0])
                                            if (!err) {
                                                console.log(result)
                                            } else {
                                                console.log(err)
                                            }
                                        })
                                    }*!/
                                }
                            })

                        }

                    }
                })*/
            }

        })
}

// 方案选项
exports.selectorView = function (req, res, next) {
    var recordId = req.query.recordId
    var currentRole = req.session.role
    var options = {}
    var _url = "http://tieta.1g9f.com/home/selector.html"
    console.log("url",_url)
    var query = {
        _id: recordId,
        status: {$gt: global.COMMON_STATUS.delete}
    }
    console.log(query)
    Record.PfindOne(query)
        .then(function (record) {
            if (record) {
                console.log("doc>>>>>>>",record)
                return Account.PfindOne({_id: record.accountId})
                    .then(function(account){
                        _.extend(record, {username: account.username, role: account.role})
                        _.extend(options, {recordId: recordId, record: record,currentRole:currentRole})
                        console.log("options>>>>",options)
                        console.log("next")
                        if(currentRole <= 1){
                            res.go('home/selector', options)
                        }else if(currentRole == 2){
                            var url = "http://tieta.1g9f.com/home/design.html?recordId="+recordId
                            res.redirect(url)
                        }

                    })
            }
          /*  _.extend(options, { nonceStr:noncestr, timeStamp:ts,signature:signature})*/

            console.log("next")
            console.log("options>>>>",options)
            res.go('home/selector', options)
        })
    // 获取微信签名所需的ticket
    /*var getTicket = function (url, res, accessData) {
        https.get('https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token='+ accessData.access_token +'&type=jsapi', function(_res){
            var str = '', resp;
            _res.on('data', function(data){
                str += data;
            });
            _res.on('end', function(){
                console.log('return ticket:  ' + str);
                try{
                    resp = JSON.parse(str);
                }catch(e){
                    return errorRender(res, '解析远程JSON数据错误', str);
                }
                var appid = global.WEIXIN_APPID
                var ticket = resp.ticket;
                var ts = createTimeStamp();
                var noncestr = createNonceStr();
                var ret = {
                    jsapi_ticket:ticket,
                    noncestr:createNonceStr(),
                    timestamp:createTimeStamp(),
                    url:'http://tieta.1g9f.com/home/selector.html'
                }
                var string = raw(ret);
                //var string = 'jsapi_ticket=' + ticket + '&noncestr=' + noncestr + '&timestamp=' + ts + '&url=' + 'http://tieta.1g9f.com/home/selector.html';
                console.log("string",string)
                var signature=sha1(string); //获得签名
                console.log("signnature",signature);

            });
        });
    };
    https.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+ 'wx07094462a0e56893' +'&secret=' + '8949a64a0b432f996080d461a3d8a862',
        function(_res) {
        var str = '';
        _res.on('data', function(data){
            str += data;
        });
        _res.on('end', function(){
            console.log('return access_token:  ' + str);
            try{
                var resp = JSON.parse(str);
            }catch(e){
                return errorRender(res, '解析access_token返回的JSON数据错误', str);
            }
            getTicket(_url, res, resp)

        });
    })*/

}

// 方案设计
exports.designView = function (req, res, next) {
    console.log('----'+req.query.recordId)
    var recordId = req.query.recordId
    var currentRole = req.session.role
    var options = {}

    var query = {
        _id: recordId,
        status: {$gt: global.COMMON_STATUS.delete}
    }
    Record.PfindOne(query)
        .then(function (record) {
            if (record) {
                return Account.PfindOne({_id: record.accountId})
                    .then(function (account) {
                        console.log("account",account)
                        _.extend(record, {username: account.username, role: account.role})
                        _.extend(options, {recordId: recordId, record: record,currentRole:currentRole})
                        res.go('home/design', options)
                    })
            } else {
                res.go('error', {error: '方案记录不存在'})
            }
        })
}

exports.pdesignView = function (req, res, next) {
    console.log('recordid----'+req.query.recordId)
    var recordId = req.query.recordId
    var actualCost = req.query.actualCost
    var currentRole = req.session.role
    var options = {}

    var query = {
        _id: recordId,
        status: {$gt: global.COMMON_STATUS.delete}
    }
    Record.PfindOne(query)
        .then(function (record) {
            if (record) {
                var username = req.session.username // 当前用户
                record.recordLog.push(username + " " + moment(new Date()).format('YYYY-MM-DD HH:mm:ss'))
                record.actualCost = actualCost
                record.username = username
                if(record.status == 2){
                    record.latestUser[2] = username + '[设计员]'
                }
                return Record.PaddOrUpdate(record)
                    .then(function (doc) {
                        return Account.PfindOne({_id: record.accountId})
                    })
                    .then(function (doc) {
                        _.extend(record, {username: doc.username, role: doc.role})
                        _.extend(options, {recordId: recordId, record: record,currentRole:currentRole})
                        res.go('home/pdesign', options)
                    })
            } else {
                res.go('error', {error: '方案记录不存在'})
            }
        })
}
// 方案记录
exports.recordView = function (req, res, next) {
    var options = {}

    res.go('home/record', options)
}

// 绑定工号
exports.bindView = function (req, res, next) {
    var options = {
    }
    res.go('home/bind', options)
}

// 登录逻辑
exports.loginLogic = function (req, res, next) {
    var username = req.body.username
    var password = md5(req.body.password)
    var autoLoginForAccount = req.body.autoLoginForAccount
    if (autoLoginForAccount) {
        username = autoLoginForAccount.username
        password = autoLoginForAccount.password
    }
    var autoLoginForRedirectUrl = req.body.autoLoginForRedirectUrl
    var autoLoginForOptions = req.body.autoLoginForOptions

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
                    if (doc.role < global.ACCOUNT_ROLES.locater) {
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
                                if (autoLoginForAccount) {
                                    // 自动登录用户, 重定向到用户访问的页面
                                    return res.redirect(autoLoginForRedirectUrl)
                                } else {
                                    json.state = 1
                                    json.message = username + ' 已登录成功'
                                    json.data.redirect = '/home/selector.html'
                                    return res.send(json)
                                }
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
        if (autoLoginForAccount) {
            // 自动登录失败, 也是跳转到绑定工号页面
            return res.go('home/bind', autoLoginForOptions)
        } else {
            json.message = message
            res.send(json)
        }
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
            .then(function(account){
                if(account){
                    account.openId = ""
                    return Account.PaddOrUpdate(account)
                        .then(function (err) {
                            // TODO 待处理 后期开启
                            // if (!doc) {
                            //     return P.reject('用户名错误')
                            // }
                            // return logoutSession(req, doc.sessions, sessionId)
                            return logoutSession(req, undefined, sessionId)
                        }).then(function () {
                            json.state = 1
                            json.message = username + ' 已登出成功'
                            json.data.redirect = '/home/bind.html'
                        }).catch(function (err) {
                            console.trace(err)
                            json.message = '系统服务出了些问题，退出失败，请稍后再试'
                        }).finally(function () {
                            res.send(json)
                        })
                }

            })


}

function logoutSession(req, sessions, logoutSessionId) {
    // TODO 待处理 后期开启
    // var remains = sessions.filter(function (session) {
    //     return session.id != logoutSessionId
    // })
    var remains = []

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