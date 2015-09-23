var remote = require('remote'),
    dialog = remote.require('dialog'),
    BrowserWindow = remote.require('browser-window'),
    shelljs = require('shelljs/global'),

    App = {
    // show choose folder path window
    chooseFolder: function (cb) {
        dialog.showOpenDialog({
            properties: ['openDirectory']
        }, cb);
    },

    //checkout git project to chosen folder
    checkoutProject: function (path) {
        cd(path);
        console.log(ls());
        exec('git --version');
    }
};
