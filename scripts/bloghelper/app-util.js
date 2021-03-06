const path = require('path')
const {clipboard,app,ipcMain} = require('electron')
const appToast = require('./app-toast')
const console = require('console');
const appPublish = require('./app-publish')

// 发布内容到媒体平台
exports.publishArticle = async (site, isPublish = true)=>{
  let editorRes = await callHtmlMethodAndWaitResult('getEditorPreviewContent', {})
  console.log("htmlText",editorRes);
  let {id,tags,title,content} = editorRes.article
  if (!title){
    // alert('没有写标题')
    appToast.toast({title: '没有写标题', body: ''})
    return
  }
  if (!content){
    // alert('没有写内容')
    appToast.toast({title: '没有写内容', body: ''})
    return
  }
  // let content = editorRes.htmlText
  // console.log("content", content);
  let dirname = ''
  // let site = appString.cnblogs 
  // let isPublish = true 
  let url = await appPublish.publishArticleTo(title, content, dirname, site, isPublish).catch(err=>{
    console.log("err", err);
  })
  // logger.log('发布文章到', site, '成功：', title)
  appToast.openPublishUrl(url, title)
}

// 主动调用index页在的方法，并等待返回数据
exports.callHtmlMethodAndWaitResult = callHtmlMethodAndWaitResult

function callHtmlMethodAndWaitResult(name, args){
  return new Promise((resolve, reject)=>{
    ipcMain.on(`${name}Back`, (event, res) => {
      // console.log(name,data) // prints "ping"
      resolve(res)
    })
    app.mainWindow.send(name, args)
  })
}

exports.test = (s)=>{
  console.log("util",s)
}

exports.testcallhtml = (s)=>{
  app.mainWindow.send('asynchronous-reply', 'pong.......'+s)
}

// 读取每一个已插入的图片链接
exports.readImgLink = (text, callback) => {
    let objReadline = text.split('\n')
    for (let i = 0; i < objReadline.length; i++) {
        let line = objReadline[i] + ''
        const split = line.indexOf('!') !== -1 ? line.split('!') : []
        for (let i = 0; i < split.length; i++) {
            let block = split[i]
            if (block.length > 4 && block.indexOf('[') !== -1 && block.indexOf(']') !== -1
                && block.indexOf('(') !== -1 && block.indexOf(')') !== -1) {
                const start = block.lastIndexOf('(')
                const end = block.lastIndexOf(')')
                const src = block.substring(start + 1, end) //图片地址
                callback(src)
            }
        }
    }
}

// 是否是网络图片
exports.isWebPicture = (src) => {
    return src.startsWith('http') && (src.endsWith('png') || src.endsWith('jpg')
                                      || src.endsWith('png') || src.endsWith('jpeg')
                                      || src.endsWith('gif') || src.endsWith('bmp')
                                      || src.indexOf('img-blog.csdn.net') !== -1)
}

// 是否是本地图片
exports.isLocalPicture = (src) => {
    return !src.startsWith('http') && (src.endsWith('png') || src.endsWith('jpg')
                                       || src.endsWith('png') || src.endsWith('jpeg')
                                       || src.endsWith('gif') || src.endsWith('bmp'))
}

// 返回图片的真实路径
exports.relativePath = (dirname, str) => {
    //若是相对路径，补齐
    if (!path.isAbsolute(str)) {
        str = path.join(dirname, str)
    }
    //最终一定是格式化好的路径
    return path.normalize(str)
}

// 返回去掉扩展名的文件名
exports.getTitle = (filePath) => {
    let title = path.basename(filePath)
    if (title.lastIndexOf('.') > 0) {
        title = title.substring(0, title.lastIndexOf('.'))
    }
    return title
}

// 格式化代码
exports.formatCode = (code) => {
    if (code === null || code.length < 1) {
        return ''
    }
    let oldText = code
    let newText = ''
    let objReadline = oldText.split('\n')
    let num = 0
    for (let i = 0; i < objReadline.length; i++) {
        let line = objReadline[i]
        if (i === 0) {
            for (let j = 0; j < line.length; j++) {
                if (line.charAt(j) === ' ') {
                    num++
                } else {
                    break
                }
            }
        }
        newText += line.substring(num)
        if (i !== objReadline.length - 1) {
            newText += '\n'
        }
    }
    return newText
}

/**
 * 版本号比较
 * @return {number}
 */
exports.compareVersion = function (v1, v2) {
    const vv1 = v1.split('.')
    const vv2 = v2.split('.')
    const length = vv1.length >= vv2.length ? vv1.length : vv2.length
    for (let i = 0; i < length; i++) {
        if (!vv1[i]) {
            vv1[i] = 0
        }
        if (!vv2[i]) {
            vv2[i] = 0
        }
        if (vv1[i] > vv2[i]) {
            return 1
        } else if (vv1[i] < vv2[i]) {
            return -1
        }
    }
    return 0
}

//只保留汉字+英文+数字
exports.stringDeal = function (str) {
    let result = ''
    for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i);
        if (c >= 0x4e00 && c <= 0x9fa5) { //汉字
            result += str.charAt(i)
        } else if (c >= 0x61 && c <= 0x7a || c >= 0x41 && c <= 0x5a) { //字母
            result += str.charAt(i)
        } else if (c >= 0x30 && c <= 0x39) { //数字
            result += str.charAt(i)
        }
    }
    return result
}

// electron MenuItem
exports.myGetMenuItemById = function myGetMenuItemById(id, myMenu) {
    const items = myMenu.items
    let found = items.find(item => item.id === id) || null
    for (let i = 0, length = items.length; !found && i < length; i++) {
        if (items[i].submenu) {
            found = myGetMenuItemById(id, items[i].submenu)
        }
    }
    return found
}

exports.myGetMenuItemByLabelPath = function myGetMenuItemByLabelPath(path, myMenu) {
    let fount
    for (const label of path) {
        fount = myMenu.items.find(item => item.label === label)
        if (!fount) {
            break
        }
        myMenu = fount.submenu
    }
    return fount
}

/**
 * 更新剪贴板文字为
 * @param newT
 */
exports.updateClipboard = function updateClipboard(newT) {
    // 清空剪贴板
    while (clipboard.readText() != null && clipboard.readText().length > 0) {
        clipboard.clear()
    }
    // 写入剪贴板
    while (clipboard.readText() !== newT) {
        clipboard.writeText(newT)
    }
    appToast.toast({title: '剪贴板已更新'})
}

/**
 * 休眠函数
 */
exports.sleep = function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}