const {ipcMain,app} = require('electron')
const tcbdb = require("./tcbdb")
const util = require("./bloghelper/app-util")
const sites = require("./bloghelper/app-string")

exports.init = function(){
  // 处理来自页面的主动、直接调用
  ipcMain.on('web2appmessagesync', async (event, options) => {
    console.log('in main options', options) // prints "ping"
    let {method, args} = options
    let res = await methods[method](args)
    if (typeof res == 'object') res = JSON.stringify(res)
    // console.log('return res',res);
    event.returnValue = res 
  })
}
// 调用page页面方法，等待结果返回
function callListThread(method, args){
  let options = {
    method,
    args
  }
  return new Promise((resolve, reject)=>{
    ipcMain.once(`app2webmessageBack`, (event, res) => {
      resolve(res)
    })
    app.listWindow.send('app2webmessage', options)
  })
}
exports.callListThread = callListThread

const methods = {
  multiplushtest:function(args){
    util.publishArticle(sites.csdn, true)
    util.publishArticle(sites.cnblogs, true)
  },
  test:function(args){
    let {a,b} = args 
    return a*b
  },
  retrieveTagsAndAllArticles:async function(args){
    let {pageSize} = args
    let res = {}

    let tagsRes = await tcbdb.article.getAllTags(app.db)
    if (tagsRes) res.tags = tagsRes.data 

    let articlesRes = await tcbdb.article.getAllArticles(app.db)
    if (articlesRes) res.articlesData = articlesRes

    return res
  },
  getAllArticlesByTag:async function(args){
    let {tag} = args 
    let res = await tcbdb.article.getArticlesByTag(app.db,tag)
    return res 
  },

  // 保存新文章至腾讯云
  saveNewArticle:async function(args){
    let {id,title,tags,content} = args 
    let res = {}
    if (id){
      res = await tcbdb.article.updateArticle(app.db, id, title, content, 'liyi', tags)
    }else{
      res = await tcbdb.article.createArticle(app.db, title, content, 'liyi', tags)
    }
    
    return {
      msg:'ok',
      data:res
    }
  },

  // 按分页、标签拉取所有内容
  getAllArticlesAndTagsByPageAndTag:async function(args){
    let {pageIndex,pageSize, tag} = args 
    // console.log('getAllArticlesByPageAndTag',args);
    let res = await tcbdb.article.getAllArticlesByPageAndTag(app.db, pageIndex,pageSize, tag)
    console.log('res',res);

    // 加上tags
    let tagsRes = await tcbdb.article.getAllTags(app.db)
    // console.log('tagsRes',tagsRes);
    if (tagsRes) res.tags = tagsRes.data

    return {
      msg:'ok',
      data:res
    }
  },
  // 尝试使窗口获得焦点
  setWindowFocused(args){
    let {name} = args
    if (name == 'index'){
      app.mainWindow.focus()
    }else if (name == 'list'){
      app.listWindow.focus()
    }
  }
}