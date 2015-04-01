CodeFile = new Meteor.Collection('code_files');

if (Meteor.isClient) {
    Meteor.Router.add({
        '/p/:id': function (id) {
            Meteor.call('setupFile', id);
            Session.set('currentFile', id);
            return 'edit';
        },
        '*': 'hello'
    });

    Template.hello.rendered = function () {
        var randomPadName = function () {
            var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            var string_length = 10;
            var randomstring = '';
            for (var i = 0; i < string_length; i++) {
                var rnum = Math.floor(Math.random() * chars.length);
                randomstring += chars.substring(rnum, rnum + 1);
            }
            return randomstring;
        }

        $('#random').click(function () {
            window.location = '/p/' + randomPadName();
        });

        $('#go').click(function () {
            Meteor.Router.to('/p/' + $('#name').val());
        });

    }

    Template.edit.rendered = function () {
        var title = Session.get("currentFile");
        var query = CodeFile.find({ id: title });

        var editor = CodeMirror(this.find('.edit'), {
            lineNumbers: true,
            indentUnit: 4,
            indentWithTabs: false,
            smartIndent: true,
            theme: 'solarized dark',
            extraKeys: {
                Tab: function (cm) {
                    cm.replaceSelection("    ", "end");
                }
            }
        });
        
        $('.CodeMirror-scroll div:first-child').css('min-height', '200px');

        $('.dropdown-toggle').dropdown();

        $('.brand').click(function () {
            window.location = '/';
        });

        $('.syntax-type').click(function () {
            CodeFile.update({ id: title }, { $set: {
                syntax: $(this).attr('data'),
            } });
        });

        $('.btn-group > .btn, .btn[data-toggle="button"]').click(function () {

            if ($(this).attr('class-toggle') != undefined && !$(this).hasClass('disabled')) {
                var btnGroup = $(this).parent('.btn-group');

                if (btnGroup.attr('data-toggle') == 'buttons-radio') {
                    btnGroup.find('.btn').each(function () {
                        $(this).removeClass($(this).attr('class-toggle'));
                    });
                    $(this).addClass($(this).attr('class-toggle'));
                }

                if (btnGroup.attr('data-toggle') == 'buttons-checkbox' || $(this).attr('data-toggle') == 'button') {
                    if ($(this).hasClass('active')) {
                        $(this).removeClass($(this).attr('class-toggle'));
                    } else {
                        $(this).addClass($(this).attr('class-toggle'));
                    }
                }

            }
        });

        $('#default').click(function () {
            editor.setOption('keyMap', 'default');
        });

        $('#vim').click(function () {
            editor.setOption('keyMap', 'vim');
        });

        $('#emacs').click(function () {
            editor.setOption('keyMap', 'emacs');
        });

        handle = query.observe({
            added: function (doc, index) {
                editor.setValue(doc.contents);
                editor.clearHistory();

                if (doc.syntax != undefined) {
                    editor.setOption('mode', doc.syntax);
                }
            },
            changed: function (newDoc, oldIndex, oldDoc) {
                if (newDoc.contents != editor.getValue()) {
                    history = editor.getHistory();
                    cursor = editor.getCursor();
                    yoffset = window.pageYOffset;
                    scroll = editor.getScrollInfo();

                    editor.setValue(newDoc.contents);

                    editor.scrollTo(scroll.left, 0);
                    window.scrollTo(0, yoffset);
                    editor.setCursor(cursor);
                    editor.setHistory(history);
                }

                if (newDoc.syntax != undefined && newDoc.syntax != oldDoc.syntax) {
                    editor.setOption('mode', newDoc.syntax);
                }
            }
        });

        editor.on('change', function (instance, change) {
            if (change['origin'] == 'setValue') return;
            CodeFile.update({ id: title }, { $set: { contents: editor.getValue() } });
        });
    }
}

if (Meteor.isServer) {
    Meteor.Router.add({
        '/p/:id/raw': function (id) {
            Meteor.call('setupFile', id);
            Session.set('currentFile', id);
            file = CodeFile.findOne({ id: id });
            return file.contents;
        }
    });

    //Meteor.Router.add('/p/:id', 'POST', function(id) {
       //Meteor.call('setupFile', id);
       //CodeFile.update({ id: id }, { $set: { contents: this.request.body.body } });
    //});

    Meteor.methods({
        'setupFile': function (title) {
            if (CodeFile.findOne({ id: title }) === undefined) {
                console.log("Creating " + title);
                CodeFile.insert({ id: title, contents: "Hello World"});
            }
        }
    });
}
