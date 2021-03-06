// 在index.html引入的文件
const { dialog } = require('electron').remote
const fs = require('fs');

// Shell var a const in the main process. 
// This is the rederer prodcess - so it is ok. 
const { shell, ipcRenderer } = require('electron');

ipcRenderer.on('asynchronous-reply', (event, message) => {
    console.log(message) // Prints 'whoooooooh!'
})

// 给主线程返回编辑区的数据
ipcRenderer.on('getEditorPreviewContent', (event, args) => {
    let tags = []
    let title = $(`#${TITLE_INPUT}`).val()
    let tagsStr = $(`#${TAGS_INPUT}`).val()
    // 发布时取预览内容，保存时取编辑内容
    let content = $(".uk-htmleditor-preview").html();
    if (tagsStr) tags = tagsStr.split(',')
    let id = data.editedArticleId
    let article = {
        id,
        title,
        tags,
        content
    }
    ipcRenderer.send('getEditorPreviewContentBack', { article })
    // 取得md内容
    // var editor = $('.CodeMirror')[0].CodeMirror;
    // editor.getValue()
    // 取得preview内容
    // $(".uk-htmleditor-preview").html()
})

ipcRenderer.on('testhtmlmethod', (event, args) => {
    console.log("message", args)
    let { a, b } = args
    a++; b++;
    ipcRenderer.send('testhtmlmethodBack', { a, b })
})

const TITLE_INPUT = 'titleipt', TAGS_INPUT = 'tagsipt', SAVE_BUTTON = 'savebtn', PUBLISH_BUTTON = 'publishbtn'

const data = {
    editedArticleId: ''
}
const methods = {
    test: function (args) {
        console.log('index..', args);
        let { a, b } = args
        return a + b
    },
    editArticle(args) {
        let { article } = args
        data.editedArticleId = article._id
        $(`#${TITLE_INPUT}`).val(article.title)
        $(`#${TAGS_INPUT}`).val(article.tags.join(','))
        // 清空编辑区文本
        $('.CodeMirror')[0].CodeMirror.setValue(article.content)
    }
}

$(document).ready(function () {
    WebMessage.init(methods)

    // initTcbApp()
    // $('#testbtn1').click((e)=>{
    //   // 这是可以很方便的
    //   let res = ipcRenderer.sendSync('synchronous-message1', 'ping')
    //   console.log(res)
    // })

    // 单击保存
    $(`#${SAVE_BUTTON}`).click(async e => {
        let tags = []
        let title = $(`#${TITLE_INPUT}`).val()
        let tagsStr = $(`#${TAGS_INPUT}`).val()

        // 发布时取预览内容，保存时取编辑内容
        // let content =  $(".uk-htmleditor-preview").html();
        let content = $('.CodeMirror')[0].CodeMirror.getValue()
        // console.log(title,tags,content);
        if (!title || !content) {
            // alert('标题与内容不能为空')
            // return
        }
        if (tagsStr) tags = tagsStr.split(',')
        // 从index向list调用是没有问题的
        // let res = await WebMessage.callListHtmlMethod('test',{a:1,b:2})
        // console.log(res);
        let res = await WebMessage.callMainThread('saveNewArticle', {
            id: data.editedArticleId,
            title,
            content,
            tags
        })
        if (typeof res == 'string') res = JSON.parse(res)
        if (res && res.msg == 'ok') {
            $(`#${TITLE_INPUT}`).val('')
            $(`#${TAGS_INPUT}`).val('')
            // 清空编辑区文本
            $('.CodeMirror')[0].CodeMirror.setValue('')
            alert('保存成功了')
            // 保存成功后，自动刷新列表页
            WebMessage.callListHtmlMethod("refresh", {})
        }

        // alert('请选择菜单：发布->博客，选择具体的媒体平台进行发布。提示：平台需要先登陆。')
    })


    // 单击发布
    $(`#${PUBLISH_BUTTON}`).click(e => {
        alert('请选择菜单：发布->博客，选择具体的媒体平台进行发布。提示：平台需要先登陆。')
    })

    // 单击发布
    $(`#multipublishbtn`).click(e => {
        WebMessage.callMainThread("multiplushtest", {})
        // alert('请选择菜单：发布->博客，选择具体的媒体平台进行发布。提示：平台需要先登陆。')
    })

});

var insertLine = function (doc, pos, text) {
    var cursor = doc.getCursor(); // gets the line number in the cursor position
    doc.replaceRange(text, pos);
};

// Matjax
var delay = (function () {
    var timer = 0;
    return function (callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();

$(document).ready(function () {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
    $('.markdown').keyup(function () {
        delay(function () {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
        }, 2000);
    });
});

$(document).on('click', "a", function (event) {
    event.preventDefault();
    var url = $(this).attr('href');
    if (url) {
        shell.openExternal(url);
    }
});

// Read file if given from commandline
$(document).ready(function () {
    var isBinaryFile = require("isbinaryfile");
    if (__args__.file !== null) {
        if (!isBinaryFile.sync(__args__.file)) {
            readMarkdownFile(__args__.file);
        }
    }
});

function getFiles(dir, files_) {
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files) {
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}

function getFilesAsMd(files) {
    var str = '';
    $.each(files, function (index, value) {
        str = str + '<a class="uikit-cm-image uk-thumbnail" href="' + value + '"><img src="' + value + '" alt=""></a>';
    });
    return str;
}

function readMarkdownFile(fileName) {

    store.currentFile = fileName;
    fs.readFile(fileName, 'utf-8', function (err, data) {
        if (err) {
            store.currentFile = null;
            UIkit.notify({
                message: err,
                status: 'error',
                timeout: 2000,
                pos: 'bottom-left'
            });
            store.currentFile = null;
            return false;
        }
        var editor = $('.CodeMirror')[0].CodeMirror;
        editor.setValue(data);
        editor.refresh();
        UIkit.notify({
            message: 'File opened',
            status: 'info',
            timeout: 2000,
            pos: 'bottom-left'
        });
        store.currentFile = fileName;
        return true;
    });
}

function openFile() {
    dialog.showOpenDialog({
        filters: [
            { name: 'markdown', extensions: ['txt', 'md', 'markdown'] }
        ]
    }, function (fileNames) {
        if (fileNames === undefined) {
            return;
        }

        var fileName = fileNames[0];
        readMarkdownFile(fileName);

    });
}

function saveMarkdownFile(fileName, data) {
    fs.writeFile(fileName, data, function (err) {
        if (err) {
            store.currentFile = null;
            UIkit.notify({
                message: err,
                status: 'error',
                timeout: 2000,
                pos: 'bottom-left'
            });
            return false;
        }

        store.currentFile = fileName;
        UIkit.notify({
            message: 'Saved file ' + fileName,
            status: 'info',
            timeout: 2000,
            pos: 'bottom-left'
        });
        return true;
    });
}

function saveFile() {
    if (typeof store.currentFile === "undefined" || store.currentFile == null) {
        saveFileAs();
    } else {
        var fileName = store.currentFile;
        var editor = $('.CodeMirror')[0].CodeMirror;
        var value = editor.getValue();
        saveMarkdownFile(fileName, value);
        return true;
    }
}
// exports.saveFile = saveFile

function saveFileAs() {
    dialog.showSaveDialog({
        filters: [
            { name: 'Save as', extensions: ['txt', 'md', 'markdown'] }
        ]
    }, function (fileName) {
        if (fileName === undefined) {
            return;
        }
        var editor = $('.CodeMirror')[0].CodeMirror;
        var value = editor.getValue();
        saveMarkdownFile(fileName, value);
    });
}
// exports.saveFileAs = saveFileAs

function openImageFile() {
    dialog.showOpenDialog({ filters: [{ name: 'Insert image', extensions: ['jpg', 'gif', 'svg', 'png', 'mp4'] }] }, function (fileNames) {
        if (fileNames === undefined) {
            return;
        }

        var fileName = fileNames[0];
        title = 'title';

        var editor = $('.CodeMirror')[0].CodeMirror;
        editor.refresh();

        var doc = editor.getDoc();
        doc.setCursor(store.pos);
        editor.focus();

        var text = '![' + title + '](' + fileName + ")";

        insertLine(doc, store.pos, text);
    });
}

function openVideoFile() {
    dialog.showOpenDialog({ filters: [{ name: 'Insert video', extensions: ['mp4'] }] }, function (fileNames) {
        if (fileNames === undefined) {
            return;
        }

        var fileName = fileNames[0];
        title = 'title';

        var editor = $('.CodeMirror')[0].CodeMirror;
        editor.refresh();

        var doc = editor.getDoc();
        doc.setCursor(store.pos);
        editor.focus();

        var text = '![' + title + '](' + fileName + ")";

        insertLine(doc, store.pos, text);
    });
};

function openFileFile() {
    dialog.showOpenDialog({ filters: [{ name: 'Insert video', extensions: ['*'] }] }, function (fileNames) {
        if (fileNames === undefined) {
            return;
        }

        var fileName = fileNames[0];
        title = 'title';

        var editor = $('.CodeMirror')[0].CodeMirror;
        editor.refresh();

        var doc = editor.getDoc();
        doc.setCursor(store.pos);
        editor.focus();

        var text = '[' + title + '](' + fileName + ")";

        insertLine(doc, store.pos, text);
    });
};

$(document).ready(function () {
    console.log("doc ready");
    $(".table-form").submit(function (e) {
        e.preventDefault();
        var rows = $(".table-rows").val();
        var cols = $(".table-cols").val();

        // Insure it is ints
        rows = parseInt(rows);
        cols = parseInt(cols);

        var text = mdtable.create(rows, cols);

        text = text.replace(/^\s+|\s+$/g, '');

        var editor = $('.CodeMirror')[0].CodeMirror;
        editor.refresh();

        var doc = editor.getDoc();

        doc.setCursor(store.pos);
        editor.focus();

        insertLine(doc, store.pos, text);

        var modal = UIkit.modal("#table-modal");
        modal.hide();

        return false;
    });


});

// // 监听主线程来的事件
// require('electron').ipcRenderer.on('ping', (event, message) => {
//   console.log(message) // Prints 'whoooooooh!'
// })

// const Koa = require('koa');
// const app = new Koa();
// const serve = require("koa-static");

// app.use(serve(__dirname));
// app.listen(5000,()=>{
//     console.log('web启动成功')
// });