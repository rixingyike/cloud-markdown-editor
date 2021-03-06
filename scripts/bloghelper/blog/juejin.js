const https = require('https');
const DataStore = require('../app-store')
const dataStore = new DataStore()
const querystring = require('querystring')
const zlib = require('zlib')
const FormData = require('form-data')
const fs = require('fs')

//上传图片到掘金
function uploadPictureToJueJin(filePath) {
    return new Promise((resolve, reject) => {
        let formData = new FormData();
        formData.append('file', fs.createReadStream(filePath))

        let headers = formData.getHeaders()
        headers.Cookie = dataStore.getJueJinCookies() //获取Cookie
        //自己的headers属性在这里追加
        let request = https.request({
                                        host: 'cdn-ms.juejin.im',
                                        method: 'POST',
                                        path: '/v1/upload?bucket=gold-user-assets',
                                        headers: headers
                                    }, function (res) {
            //解决返回数据被gzip压缩
            if (res.headers['content-encoding'] === 'gzip') {
                const gzip = zlib.createGunzip();
                res.pipe(gzip);
                res = gzip;
            }

            let str = '';
            res.on('data', function (buffer) {
                       str += buffer;
                   }
            );
            res.on('end', () => {
                const result = JSON.parse(str);
                if (result.s === 1) {
                    resolve(result.d.url.https)
                } else {
                    reject('上传图片失败,' + result.m)
                }
            });
        });
        formData.pipe(request)

        request.on('error', function (e) {
            reject('网络连接异常' + e.message)
        });
    })
}

//发布文章到掘金
function publishArticleToJueJin(title, markdown, html, isPublish) {
    return new Promise((resolve, reject) => {
        let req = https.get('https://juejin.im/auth', {
            headers: {
                'Cookie': dataStore.getJueJinCookies()
            }
        }, res => {
            if (res.statusCode !== 200) {
                reject('请先登录掘金')
                return
            }
            let str = '';
            res.on('data', function (buffer) {
                str += buffer;//用字符串拼接
            })
            res.on('end', () => {
                const result = JSON.parse(str);
                const parms = {
                    'uid': result.userId,
                    'device_id': result.clientId,
                    'token': result.token,
                    'src': 'web',
                    'category': '5562b428e4b00c57d9b94b9d',
                    'content': '',
                    'html': html,
                    'markdown': markdown,
                    'screenshot': '',
                    'isTitleImageFullscreen': '',
                    'tags': '55c1748160b28fd99e49ea68',
                    'title': title,
                    'type': 'markdown'
                }
                //真正完成发布文章的请求
                publishArticleToJueJinFact(parms, resolve, reject, isPublish)
            });
        })

        req.on('error', function (e) {
            reject('网络连接异常' + e.message)
        });
    })
}

function publishArticleToJueJinFact(parms, resolve, reject, isPublish) {
    const data = querystring.stringify(parms)
    const options = {
        method: 'POST',
        headers: {
            'Accept-Encoding': 'gzip, deflate, br',
            "Accept-Language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
            'Referer': 'https://juejin.im/editor/drafts/new',
            'Accept': '*/*',
            'Origin': 'https://juejin.im',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length,
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:45.0) Gecko/20100101 Firefox/45.0',
            'Cookie': dataStore.getJueJinCookies()

        }
    }

    const req = https.request('https://post-storage-api-ms.juejin.im/v1/draftStorage',
                              options, function (res) {
            //解决返回数据被gzip压缩
            if (res.headers['content-encoding'] === 'gzip') {
                const gzip = zlib.createGunzip();
                res.pipe(gzip);
                res = gzip;
            }

            let str = ''
            res.on('data', function (chunk) {
                str += chunk
            });
            res.on('end', () => {
                const result = JSON.parse(str)
                if (result.s === 1) {
                    if (isPublish) {
                        publiceArticleToJueJinFact(parms, result.d[0], resolve, reject)
                    } else {
                        const url = 'https://juejin.im/editor/drafts/' + result.d[0]
                        resolve(url)
                    }
                } else {
                    reject('发布失败:' + decodeURI(result.m))
                }
            });
        })

    req.on('error', function (e) {
        reject('网络连接异常' + e.message)
    });

    req.write(data)
    req.end()
}

function publiceArticleToJueJinFact(parms, postId, resolve, reject) {
    parms['postId'] = postId
    const data = querystring.stringify(parms)
    const options = {
        method: 'POST',
        headers: {
            'Accept-Encoding': 'gzip, deflate, br',
            "Accept-Language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
            'Referer': 'https://juejin.im/editor/drafts/new',
            'Accept': '*/*',
            'Origin': 'https://juejin.im',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length,
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:45.0) Gecko/20100101 Firefox/45.0',
            'Cookie': dataStore.getJueJinCookies()

        }
    }
    const req = https.request('https://post-storage-api-ms.juejin.im/v1/postPublish',
                              options, function (res) {
            //解决返回数据被gzip压缩
            if (res.headers['content-encoding'] === 'gzip') {
                const gzip = zlib.createGunzip();
                res.pipe(gzip);
                res = gzip;
            }
            let body = ''
            res.on('data', function (chunk) {
                body += chunk
            })
            res.on('end', () => {
                const result = JSON.parse(body)
                if (result.s === 1) {
                    const url = 'https://juejin.im/post/' + postId
                    resolve(url)
                } else {
                    reject('发布失败: ' + decodeURI(result.m))
                }
            });
        })

    req.on('error', function (e) {
        reject('网络连接异常' + e.message)
    });

    req.write(data)
    req.end()
}

exports.uploadPictureToJueJin = uploadPictureToJueJin
exports.publishArticleToJueJin = publishArticleToJueJin