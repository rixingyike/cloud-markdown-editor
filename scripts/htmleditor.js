/*! UIkit 2.23.0 | http://www.getuikit.com | (c) 2014 YOOtheme | MIT License */
(function (addon) {

    var component;

    if (window.UIkit) {
        component = addon(UIkit);
    }

    if (typeof define == "function" && define.amd) {
        define("uikit-htmleditor", ["uikit"], function () {
            return component || addon(UIkit);
        });
    }

})(function (UI) {

    "use strict";


    var editors = [];

    UI.component('htmleditor', {

        defaults: {
            iframe: false,
            mode: 'split',
            markdown: false,
            autocomplete: true,
            height: 800,
            maxsplitsize: 600,
            codemirror: {
                mode: 'htmlmixed',
                lineWrapping: true,
                dragDrop: false,
                autoCloseTags: true,
                matchTags: true,
                autoCloseBrackets: true,
                matchBrackets: true,
                indentUnit: 4,
                indentWithTabs: false,
                tabSize: 4,
                hintOptions: {
                    completionSingle: false
                }
            },
            toolbar: ['bold', 'italic', 'strike', 'link', 'image', 'video', 'file', 'blockquote', 'listUl', 'listOl', 'table'],
            lblPreview: 'Preview',
            lblCodeview: 'HTML',
            lblMarkedview: 'Markdown'
        },

        boot: function () {

            // init code
            UI.ready(function (context) {

                UI.$('textarea[data-uk-htmleditor]', context).each(function () {

                    var editor = UI.$(this);

                    if (!editor.data('htmleditor')) {
                        UI.htmleditor(editor, UI.Utils.options(editor.attr('data-uk-htmleditor')));
                    }
                });
            });
        },

        init: function () {

            var $this = this;

            var tpl;
            if (PROCESS_CONTEXT === 'electron') {
                tpl = UI.components.htmleditor.templateElectron;
            } else {
                tpl = UI.components.htmleditor.template;
            }

            this.CodeMirror = this.options.CodeMirror || CodeMirror;
            this.buttons = {};

            tpl = tpl.replace(/\{:lblPreview}/g, this.options.lblPreview);
            tpl = tpl.replace(/\{:lblCodeview}/g, this.options.lblCodeview);

            this.htmleditor = UI.$(tpl);
            this.content = this.htmleditor.find('.uk-htmleditor-content');
            this.toolbar = this.htmleditor.find('.uk-htmleditor-toolbar');
            this.preview = this.htmleditor.find('.uk-htmleditor-preview').children().eq(0);
            this.code = this.htmleditor.find('.uk-htmleditor-code');

            this.element.before(this.htmleditor).appendTo(this.code);
            this.editor = this.CodeMirror.fromTextArea(this.element[0], this.options.codemirror);
            this.editor.htmleditor = this;
            this.editor.on('change', UI.Utils.debounce(function () { $this.render(); }, 150));
            this.editor.on('change', function () {
                $this.editor.save();
                $this.element.trigger('input');
            });

            this.code.find('.CodeMirror').css('height', this.options.height);

            this.preview.container = this.preview;

            UI.$win.on('resize load', UI.Utils.debounce(function () { $this.fit(); }, 200));

            var previewContainer = $this.preview.parent(),
                codeContent = this.code.find('.CodeMirror-sizer'),
                codeScroll = this.code.find('.CodeMirror-scroll').on('scroll', UI.Utils.debounce(function () {

                    var codeHeight = codeContent.height() - codeScroll.height(),
                        previewHeight = previewContainer[0].scrollHeight - (previewContainer.height()),
                        ratio = previewHeight / codeHeight,
                        previewPosition = codeScroll.scrollTop() * ratio;


                    if ($this.htmleditor.attr('data-mode') == 'tab') {

                        previewContainer.scrollTop(previewPosition);

                        store.codeHeight = codeHeight;
                        store.scrollTop = codeScroll.scrollTop();
                        return;
                    }

                    previewContainer.scrollTop(previewPosition);

                }, 10));

            this.htmleditor.on('click', '.uk-htmleditor-button-code, .uk-htmleditor-button-preview', function (e) {

                e.preventDefault();
                if ($this.htmleditor.attr('data-mode') == 'tab') {

                    $this.htmleditor.find('.uk-htmleditor-button-code, .uk-htmleditor-button-preview').removeClass('uk-active').filter(this).addClass('uk-active');

                    $this.activetab = UI.$(this).hasClass('uk-htmleditor-button-code') ? 'code' : 'preview';
                    $this.htmleditor.attr('data-active-tab', $this.activetab);

                    if ($this.activetab == 'preview') {

                        var previewHeight = $('.uk-htmleditor-preview')[0].scrollHeight;
                        var scrollTop = $('.uk-htmleditor-preview')[0].scrollTop;

                        var ratio = previewHeight / store.codeHeight;
                        var scrollTop = store.scrollTop * ratio;

                        previewContainer.scrollTop(scrollTop);
                        return;
                    }

                    $this.editor.refresh();

                }
            });

            // toolbar actions
            this.htmleditor.on('click', 'a[data-htmleditor-button]', function () {

                if (!$this.code.is(':visible')) return;

                $this.trigger('action.' + UI.$(this).data('htmleditor-button'), [$this.editor]);
            });

            this.preview.parent().css('height', this.code.height());

            // autocomplete
            if (this.options.autocomplete && this.CodeMirror.showHint && this.CodeMirror.hint && this.CodeMirror.hint.html) {

                this.editor.on('inputRead', UI.Utils.debounce(function () {
                    var doc = $this.editor.getDoc(), POS = doc.getCursor(), mode = $this.CodeMirror.innerMode($this.editor.getMode(), $this.editor.getTokenAt(POS).state).mode.name;

                    if (mode == 'xml') { //html depends on xml

                        var cur = $this.editor.getCursor(), token = $this.editor.getTokenAt(cur);

                        if (token.string.charAt(0) == '<' || token.type == 'attribute') {
                            $this.CodeMirror.showHint($this.editor, $this.CodeMirror.hint.html, { completeSingle: false });
                        }
                    }
                }, 100));
            }

            this.debouncedRedraw = UI.Utils.debounce(function () { $this.redraw(); }, 5);

            this.on('init.uk.component', function () {
                $this.debouncedRedraw();
            });

            this.element.attr('data-uk-check-display', 1).on('display.uk.check', function (e) {
                if (this.htmleditor.is(":visible")) this.fit();
            }.bind(this));

            editors.push(this);
        },

        addButton: function (name, button) {
            this.buttons[name] = button;
        },

        addButtons: function (buttons) {
            UI.$.extend(this.buttons, buttons);
        },

        replaceInPreview: function (regexp, callback) {

            var editor = this.editor, results = [], value = editor.getValue(), offset = -1, index = 0;

            this.currentvalue = this.currentvalue.replace(regexp, function () {

                offset = value.indexOf(arguments[0], ++offset);

                var match = {
                    matches: arguments,
                    from: translateOffset(offset),
                    to: translateOffset(offset + arguments[0].length),
                    replace: function (value) {
                        editor.replaceRange(value, match.from, match.to);
                    },
                    inRange: function (cursor) {

                        if (cursor.line === match.from.line && cursor.line === match.to.line) {
                            return cursor.ch >= match.from.ch && cursor.ch < match.to.ch;
                        }

                        return (cursor.line === match.from.line && cursor.ch >= match.from.ch) ||
                            (cursor.line > match.from.line && cursor.line < match.to.line) ||
                            (cursor.line === match.to.line && cursor.ch < match.to.ch);
                    }
                };

                var result = callback(match, index);

                if (!result) {
                    return arguments[0];
                }

                index++;

                results.push(match);
                return result;
            });

            function translateOffset(offset) {
                var result = editor.getValue().substring(0, offset).split('\n');
                return { line: result.length - 1, ch: result[result.length - 1].length }
            }

            return results;
        },

        _buildtoolbar: function () {

            if (!(this.options.toolbar && this.options.toolbar.length)) return;

            var $this = this, bar = [];

            this.toolbar.empty();

            this.options.toolbar.forEach(function (button) {
                if (!$this.buttons[button]) return;

                var title = $this.buttons[button].title ? $this.buttons[button].title : button;

                bar.push('<li><a data-htmleditor-button="' + button + '" title="' + title + '" data-uk-tooltip>' + $this.buttons[button].label + '</a></li>');
            });

            this.toolbar.html(bar.join('\n'));
        },

        fit: function () {

            var mode = this.options.mode;

            if (mode == 'split' && this.htmleditor.width() < this.options.maxsplitsize) {
                mode = 'tab';
            }

            if (mode == 'tab') {
                if (!this.activetab) {
                    this.activetab = 'code';
                    this.htmleditor.attr('data-active-tab', this.activetab);
                }

                this.htmleditor.find('.uk-htmleditor-button-code, .uk-htmleditor-button-preview').removeClass('uk-active')
                    .filter(this.activetab == 'code' ? '.uk-htmleditor-button-code' : '.uk-htmleditor-button-preview')
                    .addClass('uk-active');
            }

            var wrapperHeight = $('.uk-htmleditor-content').height();

            // var newHeight = window.innerHeight;
            var height = this.editor.getWrapperElement().style.height;
            $('.CodeMirror').css('height', wrapperHeight + 'px'); // CodeMirror cm-s-default CodeMirror-wrap

            this.editor.refresh();
            this.preview.parent().css('height', this.code.height());

            // mode = 'tab'
            this.htmleditor.attr('data-mode', mode);

        },

        redraw: function () {
            this._buildtoolbar();
            this.render();
            this.fit();
        },

        getMode: function () {
            return this.editor.getOption('mode');
        },

        getCursorMode: function () {
            var param = { mode: 'html' };
            this.trigger('cursorMode', [param]);
            return param.mode;
        },

        render: function () {

            this.currentvalue = this.editor.getValue();

            // empty code
            if (!this.currentvalue) {

                this.element.val('');
                this.preview.container.html('');

                return;
            }

            this.trigger('render', [this]);
            this.trigger('renderLate', [this]);

            this.preview.container.html(this.currentvalue);
        },

        addShortcut: function (name, callback) {
            var map = {};
            if (!UI.$.isArray(name)) {
                name = [name];
            }

            name.forEach(function (key) {
                map[key] = callback;
            });

            this.editor.addKeyMap(map);

            return map;
        },

        addShortcutAction: function (action, shortcuts) {
            var editor = this;
            this.addShortcut(shortcuts, function () {
                editor.element.trigger('action.' + action, [editor.editor]);
            });
        },

        replaceSelection: function (replace) {

            var text = this.editor.getSelection();

            if (!text.length) {

                var cur = this.editor.getCursor(),
                    curLine = this.editor.getLine(cur.line),
                    start = cur.ch,
                    end = start;

                while (end < curLine.length && /[\w$]+/.test(curLine.charAt(end))) ++end;
                while (start && /[\w$]+/.test(curLine.charAt(start - 1))) --start;

                var curWord = start != end && curLine.slice(start, end);

                if (curWord) {
                    this.editor.setSelection({ line: cur.line, ch: start }, { line: cur.line, ch: end });
                    text = curWord;
                }
            }

            var html = replace.replace('$1', text);

            this.editor.replaceSelection(html, 'end');
            this.editor.focus();
        },

        replaceLine: function (replace) {
            var pos = this.editor.getDoc().getCursor(),
                text = this.editor.getLine(pos.line),
                html = replace.replace('$1', text);

            this.editor.replaceRange(html, { line: pos.line, ch: 0 }, { line: pos.line, ch: text.length });
            this.editor.setCursor({ line: pos.line, ch: html.length });
            this.editor.focus();
        },

        save: function () {
            this.editor.save();
        }
    });


    UI.components.htmleditor.template = [
        '<div class="uk-htmleditor uk-clearfix" data-mode="split">',
        '<div class="uk-htmleditor-navbar">',
        '<ul class="uk-htmleditor-navbar-nav uk-htmleditor-toolbar"></ul>',
        '<div class="uk-htmleditor-navbar-flip">',
        '<ul class="uk-htmleditor-navbar-nav">',
        '<li class="uk-htmleditor-button-code"><a>{:lblCodeview}</a></li>',
        '<li class="uk-htmleditor-button-preview"><a>{:lblPreview}</a></li>',
        '<li><a data-htmleditor-button="fullscreen"><i class="uk-icon-expand"></i></a></li>',
        '</ul>',
        '</div>',
        '</div>',
        '<div class="uk-htmleditor-content">',
        '<div class="uk-htmleditor-code"></div>',
        '<div class="uk-htmleditor-preview"><div></div></div>',
        '</div>',
        '</div>'
    ].join('');

    UI.components.htmleditor.templateElectron = [
        '<div class="uk-htmleditor uk-clearfix" data-mode="split">',
        '<div class="uk-htmleditor-navbar">',
        '<ul class="uk-htmleditor-navbar-nav uk-htmleditor-toolbar"></ul>',
        '<div class="uk-htmleditor-navbar-flip">',
        '<ul class="uk-htmleditor-navbar-nav">',
        '<li class="uk-htmleditor-button-code"><a>{:lblCodeview}</a></li>',
        '<li class="uk-htmleditor-button-preview"><a>{:lblPreview}</a></li>',
        '</ul>',
        '</div>',
        '</div>',
        '<div class="uk-htmleditor-content">',
        '<div class="uk-htmleditor-code"></div>',
        '<div class="uk-htmleditor-preview"><div></div></div>',
        '</div>',
        '</div>'
    ].join('');


    UI.plugin('htmleditor', 'base', {

        init: function (editor) {

            editor.addButtons({

                fullscreen: {
                    title: 'Fullscreen',
                    label: '<i class="uk-icon-expand"></i>'
                },
                bold: {
                    title: 'Bold',
                    label: '<i class="uk-icon-bold"></i>'
                },
                italic: {
                    title: 'Italic',
                    label: '<i class="uk-icon-italic"></i>'
                },
                strike: {
                    title: 'Strikethrough',
                    label: '<i class="uk-icon-strikethrough"></i>'
                },
                blockquote: {
                    title: 'Blockquote',
                    label: '<i class="uk-icon-quote-right"></i>'
                },
                link: {
                    title: 'Link',
                    label: '<i class="uk-icon-link"></i>'
                },
                image: {
                    title: 'Image',
                    label: '<i class="uk-icon-picture-o"></i>'
                },
                video: {
                    title: 'Video',
                    label: '<i class="uk-icon-video-camera"></i>'
                },
                file: {
                    title: 'File',
                    label: '<i class="uk-icon-file"></i>'
                },
                listUl: {
                    title: 'Unordered List',
                    label: '<i class="uk-icon-list-ul"></i>'
                },
                listOl: {
                    title: 'Ordered List',
                    label: '<i class="uk-icon-list-ol"></i>'
                },
                table: {
                    title: 'Table',
                    label: '<i class="uk-icon-table"></i>'
                }

            });

            addAction('bold', '<strong>$1</strong>');
            addAction('italic', '<em>$1</em>');
            addAction('strike', '<del>$1</del>');
            addAction('blockquote', '<blockquote><p>$1</p></blockquote>', 'replaceLine');
            addAction('link', '<a href="http://">$1</a>');

            var imageFn = function () {
                if (PROCESS_CONTEXT === 'electron') {
                    openImageFile();
                } else {
                    $.UIkit.modal("#image-modal").show();
                }
            };

            var videoFn = function () {
                if (PROCESS_CONTEXT == 'electron') {
                    openVideoFile();
                } else {
                    $.UIkit.modal("#video-modal").show();
                }
            };

            var fileFn = function () {
                if (PROCESS_CONTEXT == 'electron') {
                    openFileFile();
                } else {
                    $.UIkit.modal("#file-modal").show();
                }
            };

            var tableFn = function () {
                $.UIkit.modal("#table-modal").show();
            };


            var listfn = function () {

                if (editor.getCursorMode() == 'html') {

                    var cm = editor.editor,
                        pos = cm.getDoc().getCursor(true),
                        posend = cm.getDoc().getCursor(false);

                    for (var i = pos.line; i < (posend.line + 1); i++) {
                        cm.replaceRange('<li>' + cm.getLine(i) + '</li>', { line: i, ch: 0 }, { line: i, ch: cm.getLine(i).length });
                    }

                    cm.setCursor({ line: posend.line, ch: cm.getLine(posend.line).length });
                    cm.focus();
                }
            };

            var toggleFullScreen = function () {

                editor.htmleditor.toggleClass('uk-htmleditor-fullscreen');

                var wrap = editor.editor.getWrapperElement();

                if (editor.htmleditor.hasClass('uk-htmleditor-fullscreen')) {
                    editor.editor.state.fullScreenRestore = {
                        scrollTop: window.pageYOffset,
                        scrollLeft: window.pageXOffset,
                        width: wrap.style.width,
                        height: wrap.style.height
                    };

                    wrap.style.width = '';
                    wrap.style.height = editor.content.height() + 'px';
                    document.documentElement.style.overflow = 'hidden';

                } else {

                    //document.documentElement.style.overflow = '';
                    document.documentElement.style.overflow = '';
                    var info = editor.editor.state.fullScreenRestore;
                    wrap.style.width = info.width; wrap.style.height = info.height;
                    window.scrollTo(info.scrollLeft, info.scrollTop);
                }
            };

            editor.on('action.image', function () {
                imageFn();
            });

            editor.on('action.video', function () {
                videoFn();
            });

            editor.on('action.file', function () {
                fileFn();
            });

            editor.on('action.table', function () {
                tableFn();
            });

            editor.on('action.listUl', function () {
                listfn();
            });

            editor.on('action.listOl', function () {
                listfn();
            });

            if (PROCESS_CONTEXT === 'electron') {

                toggleFullScreen();

                var wrap = editor.editor.getWrapperElement();
                /*
                window.onresize = function(event) {
                    document.documentElement.style.overflow = '';
                    var info = editor.editor.state.fullScreenRestore;
                    wrap.style.width = info.width; wrap.style.height = info.height;
                    window.scrollTo(info.scrollLeft, info.scrollTop);
                    // console.log('resize');
                };*/

            }

            editor.htmleditor.on('click', 'a[data-htmleditor-button="fullscreen"]', function () {
                toggleFullScreen();

                setTimeout(function () {
                    editor.fit();
                    UI.$win.trigger('resize');
                }, 50);
            });


            // editor.addShortcut(['Ctrl-S', 'Cmd-S'], function() { editor.element.trigger('htmleditor-save', [editor]); });
            editor.addShortcutAction('bold', ['Ctrl-B', 'Cmd-B']);

            function addAction(name, replace, mode) {
                // console.log(name);
                editor.on('action.' + name, function () {
                    if (editor.getCursorMode() == 'html') {
                        editor[mode == 'replaceLine' ? 'replaceLine' : 'replaceSelection'](replace);
                    }
                });
            }
        }
    });

    UI.plugin('htmleditor', 'markdown', {

        init: function (editor) {

            var parser = editor.options.mdparser || marked || null;

            if (!parser) return;

            if (editor.options.markdown) {
                enableMarkdown();
            }

            addAction('bold', '**$1**');
            addAction('italic', '*$1*');
            addAction('strike', '~~$1~~');
            addAction('blockquote', '> $1', 'replaceLine');
            addAction('link', '[$1](http://)');

            editor.on('action.image', function () {


                if (editor.getCursorMode() == 'markdown') {

                    var cm = editor.editor,
                        pos = cm.getDoc().getCursor(true),
                        posend = cm.getDoc().getCursor(false);

                    store.pos = pos;

                    cm.focus();
                }

            });

            editor.on('action.video', function () {

                if (editor.getCursorMode() == 'markdown') {

                    var cm = editor.editor,
                        pos = cm.getDoc().getCursor(true),
                        posend = cm.getDoc().getCursor(false);

                    store.pos = pos;

                    cm.focus();
                }

            });

            editor.on('action.file', function () {


                if (editor.getCursorMode() == 'markdown') {

                    var cm = editor.editor,
                        pos = cm.getDoc().getCursor(true),
                        posend = cm.getDoc().getCursor(false);

                    store.pos = pos;
                    cm.focus();
                }

            });

            editor.on('action.table', function () {

                if (editor.getCursorMode() == 'markdown') {

                    var cm = editor.editor,
                        pos = cm.getDoc().getCursor(true),
                        posend = cm.getDoc().getCursor(false);

                    store.pos = pos;
                    cm.focus();
                }

            });

            editor.on('action.listUl', function () {
                if (editor.getCursorMode() == 'markdown') {

                    var cm = editor.editor,
                        pos = cm.getDoc().getCursor(true),
                        posend = cm.getDoc().getCursor(false);


                    for (var i = pos.line; i < (posend.line + 1); i++) {
                        cm.replaceRange('- ' + cm.getLine(i), { line: i, ch: 0 }, { line: i, ch: cm.getLine(i).length });
                    }

                    cm.setCursor({ line: posend.line, ch: cm.getLine(posend.line).length });
                    cm.focus();
                }
            });

            editor.on('action.listOl', function () {

                if (editor.getCursorMode() == 'markdown') {

                    var cm = editor.editor,
                        pos = cm.getDoc().getCursor(true),
                        posend = cm.getDoc().getCursor(false),
                        prefix = 1;

                    if (pos.line > 0) {
                        var prevline = cm.getLine(pos.line - 1), matches;

                        if (matches = prevline.match(/^(\d+)\./)) {
                            prefix = Number(matches[1]) + 1;
                        }
                    }

                    for (var i = pos.line; i < (posend.line + 1); i++) {
                        cm.replaceRange(prefix + '. ' + cm.getLine(i), { line: i, ch: 0 }, { line: i, ch: cm.getLine(i).length });
                        prefix++;
                    }

                    cm.setCursor({ line: posend.line, ch: cm.getLine(posend.line).length });
                    cm.focus();
                }
            });

            editor.on('renderLate', function () {
                if (editor.editor.options.mode == 'gfm') {
                    editor.currentvalue = parser.render(editor.currentvalue);
                }
            });

            editor.on('cursorMode', function (e, param) {
                if (editor.editor.options.mode == 'gfm') {
                    var pos = editor.editor.getDoc().getCursor();
                    if (!editor.editor.getTokenAt(pos).state.base.htmlState) {
                        param.mode = 'markdown';
                    }
                }
            });

            UI.$.extend(editor, {

                enableMarkdown: function () {
                    enableMarkdown();
                    this.render();
                },

                disableMarkdown: function () {
                    this.editor.setOption('mode', 'htmlmixed');
                    this.htmleditor.find('.uk-htmleditor-button-code a').html(this.options.lblCodeview);
                    this.render();
                }
            });

            // switch markdown mode on event
            editor.on({
                enableMarkdown: function () { editor.enableMarkdown(); },
                disableMarkdown: function () { editor.disableMarkdown(); }
            });

            function enableMarkdown() {
                editor.editor.setOption('mode', 'gfm');
                editor.htmleditor.find('.uk-htmleditor-button-code a').html(editor.options.lblMarkedview);
            }

            function addAction(name, replace, mode) {
                editor.on('action.' + name, function () {
                    if (editor.getCursorMode() == 'markdown') {
                        editor[mode == 'replaceLine' ? 'replaceLine' : 'replaceSelection'](replace);
                    }
                });
            }
        }
    });

    return UI.htmleditor;
});
