const tcb = require('@cloudbase/node-sdk')

const ARTICLES = "articles"//文章集合

exports.init = function(){
  const tcbapp = tcb.init({
    secretId: 'AKIDiPxGMBB2sSzHLqpegQu40gkgMlwbN4vU',
    secretKey: '0DAqWe182g185rTqyxiKrB8va1n4EBsJ',
    env: 'default-98491d' 
  })
  const db = tcbapp.database();
  return {tcbapp,db}
}
exports.login = async function(app){
  // let email = '',password='',username=''
  const auth = app.auth();
  const { userInfo } = await auth.getEndUserInfo();
  const ip = auth.getClientIP(); // string
}
exports.article = {
  getArticlesById:async function(db,id){
    const _ = db.command;
    let res = await db.collection(ARTICLES)
    .doc(id)
    .orderBy("updatedAt", "desc")
    .get()
    
    return res 
  },
  // 拉取所有文章标签列表
  getArticlesByTag:async function(db,tag){
    const _ = db.command;
    let rows = await db.collection(ARTICLES)
    .where({
      tags:_.in([tag])//$in needs an array
    })
    .orderBy("updatedAt", "desc")
    .get()

    let count = await db.collection(ARTICLES)
    .where({
      tags:_.in([tag])//$in needs an array
    })
    .count()

    return {rows,count}
  },
  // 拉取所有文章
  getAllArticles:async function(db){
    let rows = await db.collection(ARTICLES)
      .orderBy("updatedAt", "desc")
      .get()
      let count = await db.collection(ARTICLES)
      .count()

    return {rows,count}   
  },
  // 分页、分标签拉取所有文章，标签默认为空，表示拉取所有
  getAllArticlesByPageAndTag:async function(db,pageIndex=1,pageSize=10, tag = ''){
    const _ = db.command;
    let tags = []
    if (tag) tags = [tag]
    let skipSize = (pageIndex-1)*pageSize
    let rows = db.collection(ARTICLES)
    if (tags.length>0){
      rows = rows.where({
        tags:_.in(tags)//$in needs an array
      })
    }
    rows = await rows.skip(skipSize)
    .limit(pageSize)
    .orderBy("updatedAt", "desc")
    .get()
    console.log('rows', rows);

    let count = db.collection(ARTICLES)
    if (tags.length>0){
      count = count.where({
        tags:_.in(tags)//$in needs an array
      })
    }
    count = await count.count()

    return {rows,count} 
  },
  // 分页拉取所有文章 
  getAllArticlesByPage:async function(db,pageIndex=1,pageSize=10){
    let skipSize = (pageIndex-1)*pageSize
    let rows = await db.collection(ARTICLES)
    .skip(skipSize)
    .limit(pageSize)
    .orderBy("updatedAt", "desc")
    .get()
    let count = await db.collection(ARTICLES)
    .count()

    return {rows,count} 
  },
  // 添加一篇测试文章
  addTestArticle:async function(db,tag){
    if (typeof tag == "string") tag = [tag]
    let res = await db.collection(ARTICLES)
    .add({
      title: '标题'+new Date().toLocaleDateString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: tag,//cloud，database
      content: '内容'+new Date().toLocaleString(),
      author: 'ly'
    })
    return res 
  },
  // 创建一篇文章
  createArticle:async function(db,title,content,author,tags){
    let res = await db.collection(ARTICLES)
    .add({
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags,
      content,
      author
    })
    // .catch(err=>console.log(err))
    return res 
  },
  // 更新文章
  updateArticle:async function(db,id,title,content,author,tags){
    let res = await db.collection(ARTICLES)
    .doc(id)
    .update({
      title,
      updatedAt: new Date(),
      tags,
      content,
      author
    })
    return res 
  },
  // 删除文章
  removeArticle:async function(db,id){
    let res = await db.collection(ARTICLES)
    .doc(id)
    .remove()
    return res 
  },
  // 获取所有标签列表
  getAllTags:async function(db){
    const $ = db.command.aggregate
    let res = await db.collection(ARTICLES)
    .aggregate()
    .group({
      _id: null,
      tagsList: $.addToSet('$tags')
    })
    .end()

    // {"requestId":"1749a55605b_1","data":[{"_id":null,"tagsList":[["cloud"],["cloud","database"]]}]}
    // 将原始返回的双层数据，转为单层数据
    let data = res.data 
    let arr = []
    if (data.length>0){
      data = data[0].tagsList
      for (let j=0;j<data.length;j++){
        let arr2 = data[j]
        for (let k=0;k<arr2.length;k++){
          let tag = arr2[k]
          if (arr.indexOf(tag) < 0){
            arr.push(tag)
          }
        }
      }
    }
    res.data = arr 
    return res 
  },
}

