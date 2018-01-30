'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var P = require('bluebird')
var _ = require('lodash')

var MyUtil = require('../../lib/util.js')

var ExtMethods = {}

ExtMethods.Pfind = function (query, sort, skip, limit, projection) {
    var thisModel = this
    return new P(function (resolve, reject, notify) {
        thisModel.find(query, projection).sort(sort).skip(skip).limit(limit).exec(function (err, docs) {
            if (err) {
                reject(err)
            } else {
                resolve(MyUtil.mongoDocToJSObj(docs))
            }
        })
    })
}

ExtMethods.PfindOne = function (query, projection) {
    query = query || {}
    var thisModel = this
    return new P(function (resolve, reject, notify) {
        thisModel.findOne(query, projection, function (err, doc) {
            if (err) {
                reject(err)
            } else {
                resolve(MyUtil.mongoDocToJSObj(doc))
            }
        })
    })
}

ExtMethods.Pupdate = function (query, doc, options) {
    var thisModel = this
    return new P(function (resolve, reject, notify) {
        thisModel.update(query, doc, options, function (err, numberAffected, raw) {
            if (err) {
                reject(err)
            } else {
                resolve([numberAffected, raw])
            }
        })
    })
}

ExtMethods.PfindOneAndUpdate = function (query, update, options) {
    var thisModel = this
    return new P(function (resolve, reject, notify) {
        thisModel.findOneAndUpdate(query, update, options, function (err, doc) {
            if (err) {
                reject(err)
            } else {
                resolve(MyUtil.mongoDocToJSObj(doc))
            }
        })
    })
}

ExtMethods.PgetById = function (_id, projection) {
    return this.PfindOne({_id: _id}, projection)
}

ExtMethods.Premove = function (criteria) {
    var thisModel = this
    return new P(function (resolve, reject, notify) {
        thisModel.remove(criteria, function (err, doc) {
            if (err) {
                reject(err)
            } else {
                resolve(doc.result)
            }
        })
    })
}

ExtMethods.Pcount = function (query) {
    query = query || {}
    var thisModel = this
    return new P(function (resolve, reject, notify) {
        thisModel.count(query).exec(function (err, count) {
            if (err) {
                reject(err)
            } else {
                resolve(count)
            }
        })
    })
}

/**
 * .count may not corrently in sharded mongo
 * ref: https://docs.mongodb.com/manual/reference/command/count/
 * @param query
 * @returns {bluebird}
 */
ExtMethods.PaggregateCount = function (query) {
    query = query || {}
    var thisModel = this
    return new P(function (resolve, reject, notify) {
        thisModel.aggregate()
            .match(query)
            .group({_id: null, count: {$sum: 1}})
            .exec(function (err, doc) {
                if (err) {
                    reject(err)
                } else {
                    resolve((doc && doc[0]) ? doc[0].count : 0)
                }
            })
    })
}

ExtMethods.Psave = function (doc) {
    var thisModel = this
    return new P(function (resolve, reject, notify) {
        (new thisModel(doc)).save(function (err, doc) {
            if (err) {
                reject(err)
            } else {
                resolve(MyUtil.mongoDocToJSObj(doc))
            }
        })
    })
}

ExtMethods.Pinsert = function (docs) {
    var thisModel = this
        , saveTime = Date.now()
    return new P(function (resolve, reject, notify) {
        thisModel.collection.insert(docs, {ordered: false, writeConcern: {w: "majority", j: false, wtimeout: 1000}}
            , function (err, writeResult) {
                docs = null
                if (err) {
                    console.error(err)
                    reject(err)
                } else {
                    var len = writeResult.ops.length
                    console.log('[Pinsert] Mongo 插入数据量: ', len, ', 耗时: ', (Date.now() - saveTime)
                        , 'collection: ', thisModel.collection.name)
                    resolve(len)
                    writeResult = null
                }
            })
    })
}

module.exports = function (schema, includeMethods, excludeMethods) {
    if (schema instanceof Schema) {
        if (Array.isArray(excludeMethods) && excludeMethods.length > 0) {
            for (var k in ExtMethods) {
                if (!_.contains(excludeMethods, k)) {
                    schema.statics[k] = ExtMethods[k]
                }
            }
        }
        else if (Array.isArray(includeMethods) && includeMethods.length > 0) {
            for (var k in ExtMethods) {
                if (_.contains(includeMethods, k)) {
                    schema.statics[k] = ExtMethods[k]
                }
            }
        }
        else {
            for (var k in ExtMethods) {
                schema.statics[k] = ExtMethods[k]
            }
        }
    }
}
