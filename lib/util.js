'use strict';

var moment = require('moment')
var P = require('bluebird')
var fs = P.promisifyAll(require('fs'))
var fse = P.promisifyAll(require('fs-extra'))
var Path = require('path')
var _ = require('lodash')
var URL = require('url')
var request = require('request')
var yauzl = require('yauzl')
var targz = require('tar.gz')
var md5 = require('blueimp-md5').md5
var cp = require('child_process')
var os = require('os')
var http = require('http')
var https = require('https')
var AdmZip = require('adm-zip');
var EjsExcel = require("ejsexcel")
var Archiver = require("archiver")

var Config = require('../config.js')
var Constant = Config['Constant'] || {}

// 按照权重重新排序
exports.sortArray = function (array, key1, rate1, key2, rate2) {
    array.forEach(function (item, i) {
        var weight = item[key1] * rate1 + item[key2] * rate2
        _.extend(item, {weight: weight})
    })
    return _.sortBy(array, function (item) {
        // 倒序
        // return -item.weight;
        // 顺序
        return item.weight;
    })
}

// 创建一个关于sourcePath的硬链接,命名为targetPath
exports.PlinkAsync = function (sourcePath, targetPath) {
    var targetDir = targetPath.substring(0, targetPath.lastIndexOf('/'))
    return exports.PensureDir(targetDir)
        .then(function () {
            return fs.linkAsync(sourcePath, targetPath)
        }).catch(function (err) {
            console.trace(err)
        })
}

// 数组元素轮流返回
exports.cycleInArray = function (array) {
    var length = array.length
    var index = -1
    // 返回方法,调用记得方法调用
    return function () {
        index++
        if (index === length) {
            index = 0
        }
        return array[index]
    }
}

var DIRCached = {}
exports.PensureDir = function (dir, noCached) {
    var d = md5(dir)
    if (DIRCached[d]) {
        return P.resolve(dir);
    } else {
        // console.log('[PensureDir] 没有找到目录缓存: ', dir)
        return fse.ensureDirAsync(dir)
            .then(function () {
                if (!noCached && !DIRCached[d]) {
                    DIRCached[d] = true
                    var ranTime = Math.round(Math.random() * 1000 * 60 * 40) + 1000 * 60 * 10
                    setTimeout(function () {
                        delete DIRCached[d]
                        // console.log('[PensureDir] 清除目录缓存: ', d)
                    }, ranTime)
                }
                return dir;
            })
    }
}

exports.formatDateToString = function (date, format) {
    return moment(date).format(format)
}

exports.formatDateTime = function (date) {
    return moment(date).format('YYYY-MM-DD HH:mm:ss')
}

exports.formatDate = function (date) {
    return moment(date).format('YYYY-MM-DD')
}

exports.decompress = function (absolutePath) {
    return fs.readdirAsync(absolutePath)
        .then(function (files) {
            return P.map(files, function (file) {
                if (!exports.isZip(file)) {
                    return P.resolve()
                }
                var archive = Path.join(absolutePath, file)
                return unzip(archive, absolutePath)
                    .then(function () {
                        return fs.unlinkAsync(archive)
                    }).catch(function (err) {
                        console.error(err, archive)
                    })
            })
        })
}

// 解压
function unzip(file, dest) {
    return new P(function (resolve, reject) {
        try {
            var zip = new AdmZip(file)
            zip.extractAllTo(dest, true)
            resolve()
        } catch (err) {
            reject(err)
        }
    })
}

// 压缩
exports.zip = function (folderPath, folderName, fileName, dest) {
    return new P(function (resolve, reject) {
        try {
            // 有bug, 因为某些文件内容导致压缩后无法正常解压
            // var zip = new AdmZip()
            // zip.addLocalFolder(folderPath)
            // zip.writeZip(dest + fileName, function (err) {
            //     if (err) {
            //         reject(err)
            //     }
            //     resolve()
            // })
            // var output = fs.createWriteStream(dest + fileName)// 'archiver-unzip.zip'
            // var archive = Archiver('zip')
            // archive.on('error', function(err){
            //     if (err) {
            //         reject(err)
            //     }
            // })
            // archive.pipe(output);
            // archive.bulk([
            //     { src: [folderPath + '**']}
            // ])
            // archive.finalize()
            // resolve()

            // create a file to stream archive data to.
            var output = fs.createWriteStream(dest + fileName)// __dirname + '/example.zip'
            var archive = Archiver('zip')
            // var archive = Archiver('zip', {
            //     zlib: { level: 9 } // Sets the compression level.
            // })
            // listen for all archive data to be written
            output.on('close', function() {
                console.log(archive.pointer() + ' total bytes');
                console.log('archiver has been finalized and the output file descriptor has closed.');
            })
            // good practice to catch this error explicitly
            archive.on('error', function(err) {
                if (err) {
                    reject(err)
                }
            })
            // good practice to catch this error explicitly
            archive.on('finish', function(err) {
                resolve()
            })
            // pipe archive data to the file
            archive.pipe(output);
            // // append a file from stream
            // var file1 = __dirname + '/file1.txt'
            // archive.append(fs.createReadStream(file1), { name: 'file1.txt' })
            // // append a file from string
            // archive.append('string cheese!', { name: 'file2.txt' })
            // // append a file from buffer
            // var buffer3 = new Buffer('buff it!')
            // archive.append(buffer3, { name: 'file3.txt' })
            // // append a file
            // archive.file('file1.txt', { name: 'file4.txt' })
            // append files from a directory
            archive.directory(folderPath, folderName)
            // // append files from a glob pattern
            // archive.glob('subdir/*.txt');
            // finalize the archive (ie we are done appending files but streams have to finish yet)
            archive.finalize()
        } catch (err) {
            reject(err)
        }
    })
}

exports.decompress2 = function (archive, dest, nameSuffix) {
    if (exports.isZip(archive)) {
        return decompress_zip(archive, dest, nameSuffix)
    } else {
        return decompress_tar_gz(archive, dest, nameSuffix)
    }
}

function decompress_tar_gz(archive, dest, nameSuffix) {
    return new P(function (resolve, reject, notify) {
        var files = []
        var reader = fs.createReadStream(archive)
        var parser = targz().createParseStream()
        var defers = []

        parser.on('entry', function (entry) {
            var destPath = filterOutFile(entry.path, dest, nameSuffix)
            if (!destPath) {
                return
            }

            files.push(destPath)
            entry.pipe(fs.createWriteStream(destPath))
        })

        reader.on('error', function (err) {
            reject(err)
        })
        parser.on('error', function (err) {
            reject(err)
        })
        parser.on('finish', function () {
            resolve(files)
        })

        reader.pipe(parser)
    })
}

function decompress_zip(archive, dest, nameSuffix) {
    return new P(function (resolve, reject) {
        var files = []
        yauzl.open(archive, function (err, zipfile) {
            if (err) {
                return reject(err)
            }

            zipfile.on("entry", function (entry) {
                var destPath = filterOutFile(entry.fileName, dest, nameSuffix)
                if (!destPath) {
                    return
                }
                files.push(destPath)
                zipfile.openReadStream(entry, function (err, readStream) {
                    if (err) reject(err);
                    readStream.pipe(fs.createWriteStream(destPath));
                });
            });
            zipfile.on('close', function () {
                resolve(files)
                fs.unlinkAsync(archive)
            })
        });
    })
}

function filterOutFile(entryFilename, dest, nameSuffix) {
    if (/\/$/.test(entryFilename)) {
        return undefined;
    }

    var basename = Path.basename(entryFilename)
    if (/^\./.test(basename)) {
        return undefined
    }
    nameSuffix = nameSuffix || Date.now()
    return Path.join(dest, nameSuffix + '_' + basename)
}

exports.scanFiles = function (abPath) {
    var file_lists = []
    return (function _inner_(abPath) {
        return fs.readdirAsync(abPath)
            .then(function (files) {
                if (files.length < 0) {
                    return
                }
                return P.map(files, function (file) {
                    if (file.indexOf('.') === 0) {
                        return P.resolve()
                    }
                    var filename = Path.join(abPath, file)
                    return fs.statAsync(filename)
                        .then(function (sta) {
                            if (sta.isFile()) {
                                return file_lists.push({file_name: filename, name: file})
                            } else if (sta.isDirectory()) {
                                return _inner_(filename)
                            }
                        })
                })
            }).then(function () {
                return P.resolve(file_lists)
            })
    }(abPath))
}

exports.writeJSONFile = function (data) {
    data.fileListJSON = Path.join(data.working_dir, data.operationID + '_list.json')
    data.JSONFile = Path.join(data.working_dir, data.operationID + '.json')

    return fse.ensureDirAsync(data.working_dir)
        .then(function () {
            return fs.chmodAsync(data.working_dir, '0777')
        }).then(function () {
            return fs.writeFileAsync(data.JSONFile, JSON.stringify(data))
        }).then(function () {
            return P.resolve(data.JSONFile)
        })
}

exports.writeFile = function (path, data) {
    return fs.writeFileAsync(path, JSON.stringify(data))
}

exports.readJSONFile = function (filename) {
    return fs.readFileAsync(filename)
        .then(function (data) {
            return P.resolve(JSON.parse(data))
        })
}

// 删除文件夹
exports.removeFolder = function (folderPath) {
    // return fs.rmdir(folderPath)
    // return exports.Punlink(folderPath)
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach(function (file) {
            var curPath = folderPath + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                exports.removeFolder(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
}

exports.Punlink = function (filename) {
    return fs.unlinkAsync(filename)
}

exports.sortLabels = function (labels, categories) {
    var arr = []
    if (categories && categories.length) {
        labels.forEach(function (label, i) {
            arr.push({rate: label, label: categories[i]})
        })
    } else {
        labels.forEach(function (label, i) {
            arr.push({rate: label, label: i})
        })
    }

    return _.sortBy(arr, 'rate').reverse()
}

exports.mongoDocToJSObj = function (docs) {
    var single = false
    if (!_.isArray(docs)) {
        docs = [docs]
        single = true
    }
    for (var i = 0; i < docs.length; i++) {
        docs[i] = docs[i] ? docs[i].toObject() : docs[i]
    }
    if (single) {
        return docs[0]
    } else {
        return docs
    }
}

exports.getExtension = function (filename) {
    var url = URL.parse(filename)
    return Path.extname(url.pathname)
}

exports.isZip = function (filename) {
    return exports.getExtension(filename) === '.zip'
}

exports.isTargz = function (filename) {
    return exports.getExtension(filename) === '.gz'
}

exports.initArray = function (length, value) {
    return Array.apply(null, Array(length))
        .map(function () {
            return value;
        })
}

exports.isEmail = function (str) {
    var regEmail = /^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/gi
    return regEmail.test(str)
}

exports.trim = function (text) {
    if (typeof(text) == "string") {
        return text.replace(/^\s*|\s*$/g, "");
    }
    else {
        return text;
    }
}

exports.isEmpty = function (val) {
    switch (typeof(val)) {
        case 'string':
            return exports.trim(val).length == 0 ? true : false;
            break;
        case 'number':
            return val == 0;
            break;
        case 'object':
            return val == null || val == {};
            break;
        case 'array':
            return val.length == 0;
            break;
        default:
            return true;
    }
}

exports.childProcessArgs = function () {
    var args = []
    process.execArgv.forEach(function (arg) {
        if (arg.indexOf('debug') === -1) {
            args.push(arg)
        }
    })
    // console.log("[childProcessArgs] 子进程参数列表: ", args, process.execArgv)
    return args
}

exports.resolveRelative = function (___filename, relative) {
    return Path.join(Path.dirname(___filename), relative)
}

// 获取CPU硬件信息
exports.getCpu = function () {
    var cpus = os.cpus()
    var model = cpus[0].model
    model = md5(global.SECRET_KEY + model)
    return {model: model}
}

// 获取网络（网卡）硬件信息
exports.getNetwork = function () {
    var mac = ''
    var ip = ''
    // if(global.IS_PRODUCTION) {
    //     // Linux服务器
    //     mac = os.networkInterfaces().eth0[0].mac
    //     ip = os.networkInterfaces().eth0[0].address
    // } else {
    //     // Mac OS
    //     // mac = os.networkInterfaces().en0[1].mac
    //     ip = os.networkInterfaces().en0[1].address
    // }
    // mac = md5(global.SECRET_KEY + mac)
    // ip = md5(global.SECRET_KEY + ip)
    return {mac: mac, ip: ip}
}

var UserAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36'
    , 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36'
    , 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.7 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.7'
    , 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:39.0) Gecko/20100101 Firefox/39.0'
    , 'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X; en-us) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53'
]

exports.getHeaders = function () {
    var ran = Math.floor(Math.random() * UserAgents.length)
    return {
        'Accept': 'image/webp,*/*;q=0.8'
        , 'Accept-Encoding': '*'
        , 'Accept-Language': 'zh-CN,zhq=0.8,en-USq=0.6,enq=0.4'
        , 'Connection': 'keep-alive'
        , 'user-agent': UserAgents[ran]
    }
}

var httpKeepAliveAgent = new http.Agent({keepAlive: true});
var httpsKeepAliveAgent = new https.Agent({keepAlive: true});
exports.downloadAndReturnStream = function (fileURL, retries) {
    if (fileURL.indexOf('http') !== 0) {
        fileURL = 'http://' + fileURL
    }
    var options = URL.parse(fileURL)
    var fn = options.protocol === 'https:' ? https : http
    var timeout = exports.isZip(options.pathname) ? 15000 : 5000;

    options.headers = exports.getHeaders()
    options.agent = options.protocol === 'https:' ? httpsKeepAliveAgent : httpKeepAliveAgent;

    var req = fn.request(options);
    var res = null;
    var on_error = function () {
        req.abort()
    }

    return (new P(function (resolve, reject) {
        req.on('error', function (e) {
            on_error()

            if (retries) {
                retries--
                return resolve(exports.downloadAndReturnStream(fileURL, retries))
            } else {
                return reject(new Error("下载请求错误: " + e.message));
            }
        })

        req.on('response', function (r) {
            res = r
            res.on('error', function (err) {
                on_error()
                return reject(new Error('下载响应错误: ' + err.message))
            })
            if (!res || !res.headers || res.statusCode !== 200) {
                on_error()
                res = res || {}

                if (retries && res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
                    retries--
                    if (URL.parse(res.headers.location).hostname) {
                        fileURL = res.headers.location
                    } else {
                        fileURL = URL.resolve(fileURL, res.headers.location)
                    }
                    console.log('下载 ', res.statusCode, ' 重定向: ', fileURL)
                    return resolve(exports.downloadAndReturnStream(fileURL, retries))
                } else {
                    var err = new Error("下载 E-NOHEADERS 错误: " + res.statusCode)
                    err.userError = true
                    return reject(err)
                }
            } else {
                resolve(res)
            }
        })

        req.end()
    })).timeout(timeout)
        .catch(function (err) {
            on_error()
            err.message += ' ' + fileURL
            return P.reject(err)
        })
}

// 生成Excel
exports.generateExcel = function (templatePath, data, targetFilePath) {
    // 获得Excel模板的buffer对象
    var excelBuffer = fs.readFileSync(templatePath)
    return new P(function (resolve, reject) {
        try {
            // // getExcelArr 返回Promise对象
            // EjsExcel.getExcelArr(detailExcelBuffer).then(function(exlJson) {
            //     console.log(exlJson)
            // }).catch(function(err){
            //     console.error(err)
            // })

            // // 数据源例子
            // var data = [ [{"table_name":"现金报表","date": '2014-04-09'}],[ { 					"cb1":"001","cb1_":"002","bn1":"1","bn1_":"1","cn1":"1","cn1_":"1","num1":"1","num1_":"1", 					"cb5":"001","cb5_":"002","bn5":"1","bn5_":"1","cn5":"1","cn5_":"1","num1":"1","num5_":"1", 					"cb10":"001","cb10_":"002","bn10":"1","bn10_":"1","cn10":"1","cn10_":"1","num10":"1","num10_":"1", 					"cb20":"001","cb20_":"002","bn20":"1","bn20_":"1","cn20":"1","cn20_":"1","num20":"1","num20_":"1", 					"cb50":"001","cb50_":"002","bn50":"1","bn50_":"1","cn50":"1","cn50_":"1","num50":"1","num50_":"1", 					"cb100":"001","cb100_":"002","bn100":"1","bn100_":"1","cn100":"1","cn100_":"1","num100":"1","num100_":"1" 				},{ 					"cb1":"001","cb1_":"002","bn1":"1","bn1_":"1","cn1":"1","cn1_":"1","num1":"1","num1_":"1", 					"cb5":"001","cb5_":"002","bn5":"1","bn5_":"1","cn5":"1","cn5_":"1","num1":"1","num5_":"1", 					"cb10":"001","cb10_":"002","bn10":"1","bn10_":"1","cn10":"1","cn10_":"1","num10":"1","num10_":"1", 					"cb20":"001","cb20_":"002","bn20":"1","bn20_":"1","cn20":"1","cn20_":"1","num20":"1","num20_":"1", 					"cb50":"001","cb50_":"002","bn50":"1","bn50_":"1","cn50":"1","cn50_":"1","num50":"1","num50_":"1", 					"cb100":"001","cb100_":"002","bn100":"1","bn100_":"1","cn100":"1","cn100_":"1","num100":"1","num100_":"1" 				}]]
            // // 数据源使用
            // <%=_data_[0][0].table_name%>
            // <%forRBegin rs1,i in _data_[1]%>
            // <%=rs1.cb1+" / "+rs1.bn1%>
            // <%forREnd(8)%>

            // 用数据源(对象)data渲染Excel模板
            EjsExcel.renderExcelCb(excelBuffer, data, function (err, excelBuffer2) {
                if (err) {
                    reject(err)
                }
                // 如果该文件已存在，则原有文件内容会被覆盖
                fs.writeFile(targetFilePath, excelBuffer2, function (err) {
                    if (err) {
                        reject(err)
                    }
                    // console.log('generateExcel>>' + templatePath)
                    resolve()
                })
            })
        } catch (err) {
            reject(err)
        }
    })
}