const { ipcRenderer, remote } = require('electron');

// index 2 list
exports.callListHtmlMethod = function (method, args) {
  let options = {
    method,
    args
  }
  return new Promise((resolve, reject) => {
    ipcRenderer.once(`index2listmessageBack`, (event, res) => {
      resolve(res)
    })
    remote.app.listWindow.webContents.send('index2listmessage', options)
  })
}

// list 2 index
exports.callIndexHtmlMethod = function (method, args) {
  let options = {
    method,
    args
  }
  return new Promise((resolve, reject) => {
    ipcRenderer.once(`list2indexmessageBack`, (event, res) => {
      resolve(res)
    })
    remote.app.mainWindow.webContents.send('list2indexmessage', options)
  })
}

// 直接调用主线程上的方法，并返回它的返回值
exports.callMainThread = function (method, args) {
  let options = {
    method,
    args
  }
  let res = ipcRenderer.sendSync('web2appmessagesync', options)
  if (typeof res == 'string') res = JSON.parse(res)
  return res
}

exports.init = function (thisObj) {
  // 监听来自app主线程的调用
  ipcRenderer.on('app2webmessage', (event, options) => {
    console.log('in list page', options);
    let { method, args } = options
    let res = thisObj[method](args)
    ipcRenderer.send('app2webmessageBack', res)
  })
  // 监听来自list page的调用
  ipcRenderer.on('list2indexmessage', (event, options) => {
    console.log('in index page', options);
    let { method, args } = options
    let res = thisObj[method](args)
    remote.app.listWindow.webContents.send('list2indexmessageBack', res)
  })
  
  // 监听来自index page的调用
  // 因为是两个页面都引用了这个js文件，所以需要分别设置
  ipcRenderer.on('index2listmessage', (event, options) => {
    console.log('in list page', options);
    let { method, args } = options
    let res = thisObj[method](args)
    remote.app.mainWindow.webContents.send('index2listmessageBack', res)
  })
}

