const app = require('electron').app;
const path = require('path');
const window = require('electron-window');
const shell = require('electron').shell;
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const Menu = require("./scripts/menu");
const BlogHelper = require("./scripts/bloghelper/index")
const AppMessage = require("./scripts/app-message")
const tcbdb = require("./scripts/tcbdb")

var readFile = null;

// 热加载
const isDevelopment = false;
if (isDevelopment) {
  /* eslint-disable */
  require('electron-reload')(__dirname, {
    electron: require('${__dirname}/../../node_modules/electron'),
    ignored: /node_modules|[\/\\]\./
  });
}

require('electron-debug')({showDevTools: true});

process.argv.forEach(function (val, index, array) {
  if (index == 2) {
    readFile = val;
  } else {
    readfile = null;
  }
});

function createMainWindow() {
  let size = electron.screen.getPrimaryDisplay().workAreaSize
  let width = parseInt(size.width)
  let height = parseInt(1080 * size.width / 1920 + 30)
  var options = {
    width: width,
    height: height,
    icon: 'resources/icon.png',
    javascript: false,
    webPreferences: {
      nodeIntegration: true
    }
  };

  let mainWindow;
  mainWindow = window.createWindow(options);

  let args = {
    file: readFile
  };

  mainWindow.setMenu(null);
  // mainWindow.setFullScreen(true)
  mainWindow.showUrl(__dirname + '/editor.html', args);

  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });

  //mainWindow.maximize - just to test
  mainWindow.on('maximize', function () {
  });
  return mainWindow;
}

function createListWindow() {
  let size = electron.screen.getPrimaryDisplay().workAreaSize
  let width = parseInt(size.width)
  let height = parseInt(1080 * size.width / 1920 + 30)
  var options = {
    width: width,
    height: height,
    icon: 'resources/icon.png',
    javascript: false,
    webPreferences: {
      nodeIntegration: true
    }
  };

  let mainWindow;
  mainWindow = window.createWindow(options);

  let args = {
    file: readFile
  };

  // mainWindow.setMenu(null);
  // mainWindow.setFullScreen(true)
  mainWindow.showUrl(__dirname + '/list.html', args);

  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });

  //mainWindow.maximize - just to test
  mainWindow.on('maximize', function () {
  });
  return mainWindow;
}

let mainWindow, listWindow

app.on('ready', function () {
  // TCB.init()
  const { db, tcbapp } = tcbdb.init()
  app.db = db
  app.tcbapp = tcbapp

  // 初始化通信
  AppMessage.init()
  // 初始化原博客菜单，但不创建托盘
  BlogHelper.init()
  // app.tray = tray;
  Menu.init()

  if (!mainWindow) {
    mainWindow = createMainWindow();
    mainWindow.on('resize', function () {
      //console.log('resize'); 
    });
    app.mainWindow = mainWindow;
  }

  if (!listWindow) {
    listWindow = createListWindow();
    listWindow.on('resize', function () {
      //console.log('resize');
    });
    app.listWindow = listWindow;
    // app.listWindow.focus()
  }

});

app.on('activate', function () {
  // mainWindow.restore();
  // app.listWindow.restore()
  // app.listWindow.focus()
});

app.on('before-quit', function () {
  // Not used. Just to remember the options
});

app.on('open-file', function () {
  // Not used. Just to remember the options
});