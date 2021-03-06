// 这个模块是在html里面引入的

const methods = {
  onTest() {
    let res = WebMessage.callMainThread('test', { a: 2, b: 2 })
    console.log('调用主线程test', res);//ok
  },

  test: function (args) {
    console.log('test..', args);
    let { a, b } = args
    return a + b
  },

  // 编辑这篇文章
  editThisArticle(item) {
    console.log('id', item.id);
    WebMessage.callIndexHtmlMethod('editArticle', { article: item })
    WebMessage.callMainThread("setWindowFocused", { name: 'index' })
  },

  // 单击分页按钮时触发
  onClickPageNavigationBtn(nextPageIndex) {
    methods.retrieveDataByPageAndTag(nextPageIndex, data.currentTag)
  },

  // 单击标签名称时触发 
  onClickTag(tag) {
    methods.retrieveDataByPageAndTag(1, tag)

    // data.loading = true 
    // console.log('tag',tag);
    // data.pageIndex = 1
    // let allData = WebMessage.callMainThread('getAllArticlesByTag',{tag})
    // console.log('allData',allData);
    // data.articles = allData.rows.data 
    // data.totalSize = allData.count.total 
    // data.totalPage = Math.ceil( data.totalSize / data.pageSize)
    // data.loading = false 
  },
  refresh(args) {
    console.log('refresh');
    location.reload()
  },
  // 按页码与标签拉取数据
  // 页码默认为1，标签默认为空
  async retrieveDataByPageAndTag(pageIndex = 1, tag = '') {
    data.loading = true
    let allData = WebMessage.callMainThread('getAllArticlesAndTagsByPageAndTag', { pageIndex, pageSize: data.pageSize, tag })
    console.log('allData', allData);
    data.tags = allData.data.tags
    data.pageIndex = pageIndex
    data.currentTag = tag
    data.articles = allData.data.rows.data
    data.totalSize = allData.data.count.total
    data.totalPage = Math.ceil(data.totalSize / data.pageSize)
    data.loading = false
  }
}

let data = {
  tags: [],
  loading: true,
  currentTag: '',
  articles: [], totalSize: 0, totalPage: 0, pageSize: 5, pageIndex: 1,
  message: 'Hello!'
}
// 使用了vue框架
var app = new Vue({
  el: '#app',
  data,
  mounted: function () {
    console.log('vue app mounted');
  },
  methods
})

$(document).ready(function () {
  // 拉取首页默认数据
  console.log('list page ready');
  WebMessage.init(methods)
  methods.retrieveDataByPageAndTag(1)

  // let allData = WebMessage.callMainThread('retrieveTagsAndAllArticles',{pageSize:data.pageSize})
  // console.log('allData',allData);
  // data.tags = allData.tags 
  // data.articles = allData.articlesData.rows.data 
  // data.totalSize = allData.articlesData.count.total 
  // data.totalPage = Math.ceil( data.totalSize / data.pageSize)
  // data.loading = false
});

