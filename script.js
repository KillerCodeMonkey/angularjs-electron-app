var remote = require('remote');
var dialog = remote.require('dialog');
var BrowserWindow = remote.require('browser-window');
var shell = require('shell');

var App = {
    // show "about" window
    chooseFolder: function (cb) {
        dialog.showOpenDialog({
            properties: ['openDirectory']
        }, cb);
    }
};
