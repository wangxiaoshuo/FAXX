'use strict'

var Account = require('./service/account.js')
var Record = require('./service/record.js')
var Schema = require('./service/schema.js')
var Form = require('./service/form.js')

exports.accountLogic = function (req, res, next) {
    Account.handler(req, res, next)
}

exports.recordLogic = function (req, res, next) {
    Record.handler(req, res, next)
}

exports.schemaLogic = function (req, res, next) {
    Schema.handler(req, res, next)
}

exports.formLogic = function (req, res, next) {
    Form.handler(req, res, next)
}