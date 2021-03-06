// const remote = require('electron').remote;
// const Menu = remote.Menu;
// const MenuItem = remote.MenuItem;

const {Menu, MenuItem, app, clipboard, shell} = require('electron');
const BlogMenu = require("./bloghelper/app-menu");
const console = require('console');

function sendAction(action) {
	const win = BrowserWindow.getAllWindows()[0];

	if (process.platform === 'darwin') {
		win.restore();
	}

	win.webContents.send(action);
}

function init(){
  const template = [
   {
     label: '编程',
     submenu: [
       {
         label: '撤消',
         accelerator: 'CmdOrCtrl+Z',
         role: 'undo'
       },
       {
         label: '重做',
         accelerator: 'CmdOrCtrl+Y',
         role: 'redo'
       },
       {
         type: 'separator'
       },
       {
         label: '剪切',
         accelerator: 'CmdOrCtrl+X',
         role: 'cut'
       },
       {
         label: '拷贝',
         accelerator: 'CmdOrCtrl+C',
         role: 'copy'
       },
       {
         label: '粘贴',
         accelerator: 'CmdOrCtrl+V',
         role: 'paste'
       },
       {
         label: '全选',
         accelerator: 'CmdOrCtrl+A',
         role: 'selectall'
       },
     ]
   },
   {
     label: '视图',
     submenu: [
      {
        label: '切换到文章列表',
        accelerator: 'Alt+L',
        click: function(item, focusedWindow) {
          app.listWindow.focus()
        }
      },
      {
        label: '切换到编辑器主页',
        accelerator: 'Alt+I',
        click: function(item, focusedWindow) {
          app.mainWindow.focus()
        }
      },
       {
         label: '重新加载',
         accelerator: 'Alt+R',
         click: function(item, focusedWindow) {
           if (focusedWindow)
             focusedWindow.reload();
         }
       },
       {
         label: '切换全屏',
         accelerator: (function() {
           if (process.platform == 'darwin')
             return 'Ctrl+Command+F';
           else
             return 'F11';
         })(),
         click: function(item, focusedWindow) {
           if (focusedWindow)
             focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
         }
       },
       {
         label: '切换开发者工具',
         accelerator: (function() {
           if (process.platform == 'darwin')
             return 'Alt+Command+I';
           else
             return 'Ctrl+Shift+I';
         })(),
         click: function(item, focusedWindow) {
           if (focusedWindow)
             focusedWindow.toggleDevTools();
         }
       },
     ]
   },
   {
     label: '发布',
     submenu: BlogMenu.createBlogMenuTemplate()
   },
   {
     label: '窗口',
     role: 'window',
     submenu: [
       {
         label: '最小化',
         accelerator: 'CmdOrCtrl+M',
         role: 'minimize'
       },
       {
         label: '关闭',
         accelerator: 'CmdOrCtrl+W',
         role: 'close'
       },
     ]
   },
   {
     label: '帮助',
     role: 'help',
     submenu: [
       {
         label: '查看更多',
         click: function() { shell.openExternal('http://electron.atom.io') }
       },
     ]
   },
 ];
 
 if (process.platform == 'darwin') {
   var name = app.getName();
   template.unshift({
     label: name,
     submenu: [
       {
         label: '关于 ' + name,
         role: 'about'
       },
       {
         type: 'separator'
       },
       {
         label: '服务',
         role: 'services',
         submenu: []
       },
       {
         type: 'separator'
       },
       {
         label: '隐藏 ' + name,
         accelerator: 'Command+H',
         role: 'hide'
       },
       {
         label: '隐藏其它',
         accelerator: 'Command+Shift+H',
         role: 'hideothers'
       },
       {
         label: '显示',
         role: 'unhide'
       },
       {
         type: 'separator'
       },
       {
         label: '退出',
         accelerator: 'Command+Q', //,
         role: 'quit'
       },
     ]
   });
   template[3].submenu.push(
     {
       type: 'separator'
     },
     {
       label: '保持至最前面',
       role: 'front'
     }
   );
 }
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  console.log('Menu.setApplicationMenu(menu)',Menu.setApplicationMenu(menu));
}
exports.init = init
