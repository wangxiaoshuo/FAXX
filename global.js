'use strict';

var _ = require('lodash')
var fs = require('fs-extra')

module.exports = function () {
    var global_ = {
        WEIXIN_TOKEN: 'JSPTPD_FAXX',
        //测试
     /*   WEIXIN_APPID: 'wx75e412030820a85e',
        WEIXIN_APPSECRET: '46027899111492ed8aac304520724cd6',
        WEIXIN_TEMPLATE_ID : "awZCg_Rjx-Sd0mJjSiXye0I73ArxV8elKLhxtSP5fsA",*/

        //正式
        WEIXIN_APPID: 'wx07094462a0e56893',
        WEIXIN_APPSECRET: '8949a64a0b432f996080d461a3d8a862',
        WEIXIN_TEMPLATE_ID : "eylBwiWbHD8dbWkeaNQYuqsu-Askls2PqA_vMjusOx8",
        IS_PRODUCTION: 'production' === process.env.NODE_ENV,
        // 用户角色
        ACCOUNT_ROLES: {
            locater: 0,// 选址人员
            selecter: 1,// 选型人员
            designer: 2,// 设计人员
            manager: 10// 管理员
        },
        // 操作者状态
        OPERATOR_STATUS: {
            delete: -1, unaudited: 0, normal: 1, refused: 2
        },
        // 通用状态
        COMMON_STATUS: {
            // 其他、删除、异常（禁用|下线|结束|隐藏|未识别|普通）、正常（启用|上线|开始|显示|已识别|重点）、未告警（进行中|已展示）、已告警、未处理、已处理
            other: -2, delete: -1, disable: 0, enable: 1, unwarn: 2, warned: 3, undeal: 4, dealed: 5, blacklist: 6
        },
        // 监控权重
        MC_WEIGHT: {
            // 目前支持五级权重
            level1: 1, level2: 2, level3: 3, level4: 4, level5: 5
        },
        // 接口响应代码
        API_RESPONSE_CODE: {
            succeed: 1,
            unauth: 0,
            failed: -1,
            failed_other: -2,
            unknown: -3
        },
        MAP_CONCURRENCY: {
            small: 1,
            medium: 10,
            large: 20
        },
        // TODO ......

        AC_TYPE: {
            // 目前支持文字、图片、视频、音频
            words: 0, picture: 1, video: 2, audio: 3
        },
        AC_ENGINE: {
            // 目标指定的动作引擎: 简易pyspider、全面selenium
            pyspider: 0, selenium: 1
        },



        TAG_SCALE: {
            good: 80,
            soso: 60,
            bad: 0
        },
        ADMIN_EMAIL: 'service@zhinengming.com',
        ALARM_FLAG: {
            GServer: '与GServer通信告警'
        },
        DL_OPERATION_TYPE: {
            test: 'test'
        },
        API_TASK_STATUS: {
            close: 0, normal: 1
        },
        APPLICATION_STATUS: {
            delete: -1, close: 0, normal: 1, disable: 2
        },
        VIOLATION_STATUS: {
            unwarn: 0, warned: 1
        },
        ACCESS_KEY: 'CD0FF6892CA611239F',
        SECRET_KEY: 'AD64401D159F23B9DQ'
    }

    _.extend(global, global_)
}
