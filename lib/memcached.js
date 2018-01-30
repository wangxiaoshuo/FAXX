'use strict';

var Memcached = require('memcached')
var P = require('bluebird');
var toArray = require('stream-to-array')
var Path = require('path')
var yauzl = require('yauzl')
var tar = require('tar-stream')
var gunzip = require('gunzip-maybe')
var fs = require('fs')
var URL = require('url')

var MyUtil = require('./util.js')
var Config = require('../config.js')
var DataDisks = Config['DataDisks'] || {}
var Constant = Config['Constant'] || {}
var MEM_CACHED = Constant['MEMCACHED']

var WRITING_FILES_COUNT = 0;
var WRITING_FILES_COUNT_MAX = 500;

// TODO 待处理 根据硬件确定Memcached的有效时间
var LIFETIME = global.isAPP ? 60 * 5 : 60 * 1;// 秒为单位
var options = {
    // the maximum key size allowed.
    maxKeySize: 250,// 由memcached 服务器允许的键的最大尺寸
    // the maximum expiration time of keys (in seconds).
    maxExpiration: LIFETIME,// 钥匙由以毫秒为单位memcached 服务器的最大期限
    // the maximum size of a value.
    maxValue: 1024 * 1024 * 1000,  // 即允许memcached 服务器的值的最大尺寸, 1048576字节(b)=1兆字节(mb)
    // the maximum size of the connection pool.
    poolSize: 2000,// 我们可以在我们的连接池配置的最大连接数
    // the hashing algorithm used to generate the hashRing values.
    algorithm: 'md5',// 应该被用来产生hashRing 值的散列算法
    // the time between reconnection attempts (in milliseconds).
    reconnect: 1000 * 60 * 3,// 当服务器被标记为死, 我们将尝试重新连接每隔x 毫秒
    // the time after which Memcached sends a connection timeout (in milliseconds).
    timeout: 1000 * 5,// 在 x 毫秒的服务器应该发送一个超时, 如果我们无法连接, 这也将用于关闭连接, 如果我们是空闲的
    // the number of socket allocation retries per request.
    retries: 5,// 多少次重试指定分配的请求
    // the number of failed-attempts to a server before it is regarded as 'dead'.
    failures: 5,// 多少次的服务器可能有之前标记为死的数量
    // the time between a server failure and an attempt to set it up back in service. (ms)
    retry: 1000 * 5,// 多少时间把服务器恢复服务之前失败之间等等
    // if true, authorizes the automatic removal of dead servers from the pool.
    remove: false,// 假的,当服务器被标记为死你可以从池中移除, 因此所有其他在此领取钥匙代替
    // an array of server_locations to replace servers that fail and that are removed from the consistent hashing scheme.
    failOverServers: [MEM_CACHED],// 未定义, 有能力利用这些服务器作为故障转移时, 被杀死的服务器获得由一致的散列方案中的删除, 这必须是服务器阵列确认server_locations 规范
    // , whether to use md5 as hashing scheme when keys exceed maxKeySize.
    keyCompression: true,// true 则使用MD5, 如果他们超过maxKeySize 压缩选项键
    // the idle timeout for the connections.
    idle: 5000// 空闲超时的连接
};

var MemcachedObj = new Memcached(MEM_CACHED, options);

var DispatchDataDisks = [];
+(function init() {
    DispatchDataDisks = global.isAPP ? DataDisks['APP'] : DataDisks['API']
}());
var getFileStorageDir = MyUtil.cycleInArray(DispatchDataDisks);

exports.DOWNLOAD_FAILED = Path.join(DispatchDataDisks[0], '/not/exists');

exports.connectMemcached = function () {
    var init_test = function () {
        return pushToCache('init_test', new Buffer('init test'), 'init_test')
    };
    var count = 10;
    var promises = [];
    for (var i = 0; i < count; i++) {
        promises.push(init_test)
    }
    return P.any(promises)
}

/*
 * key 缓存键, 如: experience
 * rs 文件流
 * filename 文件名, 如: sq.jpg
 * isWriteDisk 是否写磁盘, 一般都是true
 * saveDir 需指定的存储目录, 如: /Applications/AMPPS/www/download/baidu-picture/{keyword}
 */
exports.upload = function (key, rs, filename, isWriteDisk, saveDir, isTruthName) {
    // 客户端请求参数的字符集必须为UTF-8,否则filename会出现乱码??
    // console.log('key: ' + key + '; rs: ' + rs + '; filename: ' + filename + '; isWriteDisk: ' + isWriteDisk + '; saveDir: ' + saveDir)
    if (MyUtil.isZip(filename)) {
        return zipLogic(key, rs, isWriteDisk, saveDir)
    } else if (MyUtil.isTargz(filename)) {
        return targzLogic(key, rs, isWriteDisk, saveDir)
    } else {
        return fileLogic(key, rs, filename, isWriteDisk, saveDir, isTruthName)
    }
}

/*
 * key 缓存键, 如: experience
 * url 图片网址, 如: http://hiphotos.baidu.com/%B3%A4%D4%F3%BA%CD%C3%F7/pic/item/79b8b89bb26d8afcc8eaf449.jpg
 * path 存储路径, 如: /Applications/AMPPS/www/download/baidu-picture/{keyword}
 * isWriteDisk 是否写磁盘, 一般都是true
 */
exports.download = function (key, url, path, isWriteDisk) {
    return MyUtil.downloadAndReturnStream(url, 5)
        .then(function (rs) {
            var pathname = URL.parse(url).pathname
            var filename = pathname.substring(pathname.lastIndexOf('/') + 1, pathname.length)
            exports.upload(key, rs, filename, isWriteDisk, path)
        })
}

function targzLogic(key, rs, isWriteDisk, saveDir) {
    var extract = tar.extract()
    var files = []
    var promises = []
    return new P(function (resolve, reject) {
        extract.on('entry', function (header, stream, next) {
            if (!verifyEntry(header.name)) {
                return next()
            }
            promises.push(
                fileLogic(key, stream, header.name, isWriteDisk, saveDir)
                    .then(function (list) {
                        files = files.concat(list)
                        next()
                    }).catch(function (err) {
                    console.error('[targzLogic]', err)
                    next()
                })
            )
        })

        extract.on('finish', function () {
            P.all(promises).then(function () {
                resolve(files)
            })
        })
        extract.on('error', function (err) {
            reject(err)
        })

        rs.pipe(gunzip()).pipe(extract)
    })
}

function zipLogic(key, rs, isWriteDisk, saveDir) {
    return streamToBuffer(rs).then(function (buffer) {
        return new P(function (resolve, reject) {
            var files = [], promises = []

            yauzl.fromBuffer(buffer, function (err, zipfile) {
                if (err) {
                    return reject(err)
                }

                zipfile.on("entry", function (entry) {
                    if (!verifyEntry(entry.fileName)) {
                        return
                    }
                    promises.push(
                        _zipLogic(key, zipfile, entry, isWriteDisk, saveDir)
                            .then(function (list) {
                                files = files.concat(list)
                            }).catch(function (err) {
                                console.error('[zipLogic]', err)
                            })
                    )
                });
                zipfile.on('error', function (err) {
                    reject(err)
                })

                zipfile.on('end', function () {
                    P.all(promises).then(function () {
                        resolve(files)
                    })
                })
            });
        })
    })
}

function _zipLogic(key, zipFile, entry, isWriteDisk, saveDir) {
    return new P(function (resolve, reject) {
        zipFile.openReadStream(entry, function (err, readStream) {
            if (err) {
                return reject(err);
            }

            fileLogic(key, readStream, entry.fileName, isWriteDisk, saveDir)
                .then(function (list) {
                    resolve(list);
                }).catch(function (err) {
                reject(err)
            })
        });
    })
}

function getFileDir(key, saveDir) {
    var date = new Date();
    var dest = Path.join(getFileStorageDir(), MyUtil.formatDate(date), date.getHours().toString(), key);
    // 当指定存储路径时
    if (saveDir) {
        dest = saveDir
    }
    return MyUtil.PensureDir(dest);
}

function fileLogic(key, stream, req_filename, isWriteDisk, saveDir, isTruthName) {
    var filename = ''
    return getFileDir(key, saveDir)
        .then(function (dir) {
            filename = Path.join(dir, generateFileName(req_filename));
            if (isTruthName) {
                filename = Path.join(dir, req_filename);
            }
            return streamToBuffer(stream);
        }).then(function (buffer) {
            var bufferStr = buffer.toString('base64');
            if (isWriteDisk) {
                writeToDisk(filename, bufferStr)
            }
            return pushToCache(filename, bufferStr, req_filename, key);
        }).then(function () {
            return [{name: req_filename, file_name: filename}];
        })
}

function streamToBuffer(stream) {
    return new P(function (resolve, reject, notify) {
        toArray(stream, function (err, arr) {
            if (err) {
                return reject(err);
            }

            var buffers = [];
            for (var i = 0, l = arr.length; i < l; ++i) {
                var part = arr[i]
                buffers.push((part instanceof Buffer) ? part : new Buffer(part))
            }
            resolve(Buffer.concat(buffers))
        })
    })
}

function pushToCache(filename, bufferStr, req_filename, key) {
    return new P(function (resolve, reject, notify) {
        if (bufferStr.length > options.maxValue) {
            return reject(new Error([key, '错误的文件大小: ', bufferStr.length, req_filename].join(' ')))
        }
        // console.log('pushToCache>>' + filename)
        // console.log('key>>' + key)
        MemcachedObj.set(filename, bufferStr, LIFETIME, function (err) {
            if (err) {
                console.trace(err)
                reject(new Error([key, err.message, req_filename].join(' ')));
            } else {
                resolve(filename);
            }
        });
    })
}

exports.getAndWriteDisk = function (key) {
    return MyUtil.PensureDir(Path.dirname(key))
        .then(function () {
            return getFromCache(key)
        }).then(function (buf) {
            writeToDisk(key, buf);
        }).catch(function (err) {
            console.error('[getAndWriteDisk]', err)
        })
}

function getFromCache(key) {
    return new P(function (resolve, reject, notify) {
        MemcachedObj.get(key, function (err, buffer) {
            if (err) {
                reject(err);
            } else {
                resolve(buffer);
            }
        });
    })
}

function writeToDisk(destFile, buffer) {
    if (WRITING_FILES_COUNT > WRITING_FILES_COUNT_MAX) {
        return console.error("[writeToDisk] 磁盘写入繁忙: ", destFile);
    }
    WRITING_FILES_COUNT++;
    fs.writeFile(destFile, buffer, {encoding: 'base64'}, function (err) {
        WRITING_FILES_COUNT--;
        if (err) {
            console.trace('[writeToDisk] 磁盘写入错误: ', destFile, err);
        } else {
            console.log('[writeToDisk] 磁盘写入完成: ', destFile)
        }
    })
}

function generateFileName(req_filename) {
    return [Date.now(), Math.random(), MyUtil.getExtension(req_filename)].join('');
}

function verifyEntry(fileName) {
    if (/\/$/.test(fileName)) {
        return false;
    }

    var basename = Path.basename(fileName)
    return !/^\./.test(basename);
}