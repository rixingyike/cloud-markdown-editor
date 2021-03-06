const {BrowserWindow, session} = require('electron')
const https = require('https');
const DataStore = require('../app-store')
const dataStore = new DataStore()
const fs = require('fs')
const FormData = require('form-data')

//上传图片至思否
function uploadPictureToSegmentFault(filePath) {
    return new Promise((resolve, reject) => {
        let formData = new FormData();
        formData.append('image', fs.createReadStream(filePath))

        let headers = formData.getHeaders()
        headers.Cookie = dataStore.getSegmentFaultCookie() //获取Cookie
        //自己的headers属性在这里追加
        let request = https.request({
                                        host: 'segmentfault.com',
                                        method: 'POST',
                                        path: '/img/upload/image?_='
                                              + dataStore.getSegmentFaultToken(),
                                        headers: headers
                                    }, function (res) {
            let str = '';
            res.on('data', function (buffer) {
                       str += buffer;
                   }
            );
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const result = JSON.parse(str);
                    if (result[0] === 0) {
                        resolve(result[1])
                    } else {
                        reject('上传图片失败,' + decodeURI(result[1]))
                    }
                } else {
                    reject('上传图片失败:' + res.statusCode)
                }
            });
        });
        formData.pipe(request)

        request.on('error', function (e) {
            console.log('problem with request: ' + e.message);
            reject('网络连接异常')
        });
    })
}

// 上传文章到思否第一步
// 先进行必要认证
function publishArticleToSegmentFault(title, content, isPublish) {
    return new Promise((resolve, reject) => {
        let win = new BrowserWindow({width: 1, height: 1})
        win.loadURL('https://segmentfault.com/howtowrite').then()
        //页面加载完
        win.webContents.on('did-finish-load', (event, result) => {
            if (win.webContents.getURL() === 'https://segmentfault.com/howtowrite') {
                // 点击按钮，开始导航到新地址
                win.webContents.executeJavaScript(
                    `document.querySelector("body > div > div > div > div > div > div > div > a").click()`)
                    .then()
            } else if (win.webContents.getURL() === 'https://segmentfault.com/write?freshman=1') {
                // 读取token
                win.webContents.executeJavaScript(`window.SF.token`).then((result) => {
                    dataStore.setSegmentFaultToken(result)
                    // 关闭窗口
                    win.destroy()
                })
            } else {
                // 关闭窗口
                win.destroy()
            }
        })
        //页面关闭后
        win.on('closed', () => {
            win = null
            // 查询所有与设置的 URL 相关的所有 cookies.
            session.defaultSession.cookies.get({url: 'https://segmentfault.com/'})
                .then((cookies) => {
                    let cookieString = ''
                    for (let cookie of cookies) {
                        cookieString += cookie.name + '=' + cookie.value + '; '
                    }
                    dataStore.setSegmentFaultCookie(cookieString.trim())
                    publishArticleToSegmentFaultFact(title, content, resolve, reject, isPublish)
                }).catch((error) => {
                console.error(error)
            })
        })
    })
}

function getFormData(title, text) {
    const formData = new FormData();
    formData.append('type', 1)
    formData.append('url', '')
    formData.append('blogId', 0)
    formData.append('isTiming', 0)
    formData.append('created', '')
    formData.append('weibo', 0)
    formData.append('license', 0)
    formData.append('tags', 1040000000089556)
    formData.append('title', title)
    formData.append('text', text)
    formData.append('articleId', '')
    formData.append('draftId', '')
    formData.append('id', '')

    const headers = formData.getHeaders()
    headers.Cookie = dataStore.getSegmentFaultCookie() //获取Cookie
    //自己的headers属性在这里追加
    headers.referer = 'https://segmentfault.com/write?freshman=1'
    headers.origin = 'https://segmentfault.com'
    headers['x-requested-with'] = 'XMLHttpRequest'
    headers['accept-language'] = 'zh-CN,zh;q=0.9,en;q=0.8'
    headers['accept-encoding'] = 'deflate, br'
    headers['accept'] = '*/*'
    headers['sec-fetch-site'] = 'sec-fetch-site'
    headers['sec-fetch-mode'] = 'cors'
    headers['User-Agent'] =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36'
    return {formData, headers}
}

//上传文章到思否第二步
function publishArticleToSegmentFaultFact(title, text, resolve, reject, isPublish) {
    const {formData, headers} = getFormData(title, text)
    const request = https.request(
        'https://segmentfault.com/api/article/draft/save?_=' + dataStore.getSegmentFaultToken(), {
            method: 'POST',
            headers: headers
        }, function (res) {
            let str = '';
            res.on('data', function (buffer) {
                str += buffer;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const result = JSON.parse(str);
                    if (result.status === 0) {
                        if (isPublish) {
                            const obj = getFormData(title, text)
                            obj.formData.append('draftId', result.data)
                            publicArticleToSegmentFault(obj.formData, obj.headers, resolve, reject)
                        } else {
                            const url = 'https://segmentfault.com/write?draftId=' + result.data
                            resolve(url)
                        }
                    } else {
                        reject('发布失败,' + unescape(str.replace(/\\u/g, '%u')))
                    }
                } else {
                    reject('发布失败，可能未登录思否！' + res.statusCode)
                }
            });
        });
    formData.pipe(request)

    request.on('error', function (e) {
        reject('网络连接异常')
    });
}

/**
 * 发布文章
 */
function publicArticleToSegmentFault(formData, headers, resolve, reject) {
    const request = https.request('https://segmentfault.com/api/articles/add?_='
                                  + dataStore.getSegmentFaultToken(), {
                                      method: 'POST',
                                      headers: headers
                                  }, function (res) {
        let str = '';
        res.on('data', function (buffer) {
            str += buffer;
        });
        res.on('end', () => {
            if (res.statusCode === 200) {
                const result = JSON.parse(str);
                if (result.status === 0) {
                    const url = 'https://segmentfault.com' + result.data.url
                    resolve(url)
                } else {
                    reject('发布失败,' + unescape(str.replace(/\\u/g, '%u')))
                }
            } else {
                reject('发布失败:' + res.statusCode + "\n" + unescape(str.replace(/\\u/g, '%u')))
            }
        });
    })

    formData.pipe(request)

    request.on('error', function (e) {
        reject('网络连接异常' + e.message)
    });
}

exports.uploadPictureToSegmentFault = uploadPictureToSegmentFault
exports.publishArticleToSegmentFault = publishArticleToSegmentFault