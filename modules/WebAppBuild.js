var zipper = require('zip-local'),
    Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs-extra')),
    path = require('path'),
    Build = require('./Build');

function WebAppBuild() {
    Build.call(this);
}

// inherit everything from Build class
WebAppBuild.prototype = new Build();
WebAppBuild.prototype.additionalPath = '';

// create build directory
WebAppBuild.prototype.build = function (options, cb) {
    'use strict';

    var self = this,
        tasks = [];

    options = options || {};
    self.host = options.host;

    // necessary data not set
    if (!this.path || !this.cloned || !this.checkedOut) {
        return cb();
    }

    // create build dir
    fs.mkdirs(this.path + '/build/app', function (dirErr) {
        if (dirErr) {
            return cb(dirErr);
        }
        // write correct settings.js
        fs.writeFile(self.path + '/app/settings.js', options.settingsContent, function () {
            // Build steps
            tasks = [
                self.copyFiles(self.path).then(function () {
                    return Promise.all([
                        self.optiImage(self.path, '/build/resources', '/build/resources'),
                        self.createAppBuildConfig(self.path, self.includePaths)
                    ]);
                }).then(function () {
                    return self.uglifyMinify(self.path);
                }),
                self.clearIndex(self.path)
            ];

            Promise.all(tasks).then(function () {
                // create final zip
                zipper.zip(path.normalize(self.path + '/build'), function (zipped) {
                    zipped.compress();
                    var finalpath = self.path + '_' + self.getDate() + '.zip';
                    zipped.save(path.normalize(finalpath));
                    fs.remove(self.path, function () {
                        self.package = path.normalize(finalpath);
                        cb(null, path.normalize(finalpath));
                    });
                });
            }, cb);
        });
    });
};

module.exports = WebAppBuild;
