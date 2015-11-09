var MobileBuild = require('./MobileBuild'),
    zipper = require('zip-local'),
    Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs-extra')),
    path = require('path');

function PhoneGapBuild() {
    MobileBuild.call(this);
}

PhoneGapBuild.prototype = new MobileBuild();
PhoneGapBuild.prototype.additionalPath = '';
PhoneGapBuild.prototype.build = function (options, cb) {
    'use strict';

    var self = this,
        tasks = [];

    options = options || {};

    if (!(options.appName && options.appVersion)) {
        return cb();
    }
    self.appName = options.appName;
    self.appVersion = options.appVersion;
    self.host = options.host;

    // necessary data not set
    if (!this.path || !this.cloned || !this.checkedOut) {
        console.log(this.path, this.cloned, this.checkedOut);
        return cb();
    }

    fs.mkdirs(this.path + '/build/app', function (dirErr) {
        if (dirErr) {
            return cb(dirErr);
        }
        fs.writeFile(self.path + '/app/settings.js', options.settingsContent, function () {
            tasks = [
                self.copyFiles(self.path).then(function () {
                    return Promise.all([
                        self.optiImage(self.path, '/build/resources', '/build/resources'),
                        self.createAppBuildConfig(self.path, self.includePaths)
                    ]);
                }).then(function () {
                    return self.uglifyMinify(self.path);
                }),
                self.clearIndex(self.path, self.appVersion),
                self.createConfig(self.path, self.path + '/build', self.appName, self.appVersion)
            ];

            Promise.all(tasks).then(function () {
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

module.exports = PhoneGapBuild;
