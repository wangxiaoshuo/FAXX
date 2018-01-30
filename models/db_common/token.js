/**
 * Created by Administrator on 2017/6/30.
 */
/*
var mongoose = require('mongoose')
var Schema = mongoose.Schema

var TokenSchema = Schema({
    access_token: {
        type:String
    },
    expires_in: {
        type:Number
    },
    refresh_token: {
        type:String
    },
    openid: {
        type:String
    },
    scope: {
        type:String
    },
    create_at: {
        type:String
    }
})

TokenSchema.statics.getToken = function (openid, cb) {
    this.findOne({openid:openid}, function (err, result) {
        if (err) throw err;
        return cb(null, result);
    });
};
TokenSchema.statics.setToken = function (openid, token, cb) {
    // 有则更新，无则添加
    var query = {openid: openid};
    var options = {upsert: true};
    this.update(query, token, options, function (err, result) {
        if (err) throw err;
        return cb(null);
    });
};

mongoose.model('Token', 'TokenSchema');

module.exports = TokenSchema*/
