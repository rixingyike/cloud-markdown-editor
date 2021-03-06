const { app, BrowserWindow } = require('electron')
const path = require("path")

function openIndex () {   
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.loadFile(path.resolve('index.html'))
  // 打开开发者工具
  win.webContents.openDevTools()
}

exports.openIndex = openIndex