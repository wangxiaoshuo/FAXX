'use strict';

var P = require('bluebird')
var _ = require('lodash')
var nodemailer = require('nodemailer')
var smtpTransport = require('nodemailer-smtp-transport')

var transporter = nodemailer.createTransport(smtpTransport({
        auth: {
            user: 'open-platform@zhinengming.com',
            pass: 'Qwer1234!'
        },
        host: "smtp.exmail.qq.com",
        port: 465,
        secure: true
    }))

exports.send = function (options) {
    var o = {from: 'open-platform@zhinengming.com'}
    _.extend(options, o)
    return new P(function (resolve, reject, notify) {
        transporter.sendMail(options, function (err, info) {
            if (err) {
                reject(err)
            } else {
                resolve(info)
            }
        })
    })
}