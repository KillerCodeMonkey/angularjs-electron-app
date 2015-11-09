var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs-extra')),
    path = require('path'),
    exec = require('child_process').exec,
    MobileBuild = require('./MobileBuild');

function buildAndroid(basePath, targetDir) {
    'use strict';

    return new Promise(function (resolve, reject) {
        exec('cd ' + path.normalize(basePath) + '&& ionic state reset && ionic build android', function (cdErr, cdOut, cdsErr) {
            if (cdErr && cdsErr) {
                return reject(cdsErr || cdOut);
            }
            fs.copy(path.normalize(basePath + '/platforms/android/build/outputs/apk'), path.normalize(targetDir), function (statErr) {
                if (statErr) {
                    return reject();
                }
                resolve();
            });
        });
    });
}

function buildiOS(basePath) {
    'use strict';

    return new Promise(function (resolve) {
        resolve();
    });
}

// constructor
function IonicCLIBuild() {
    MobileBuild.call(this);
}

// inherit from Build class.
IonicCLIBuild.prototype = new MobileBuild();

IonicCLIBuild.prototype.additionalPath = '/www';

// create build directory
IonicCLIBuild.prototype.build = function (options, cb) {
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
        return cb();
    }

    fs.mkdirs(this.path + this.additionalPath + '/build/app', function (dirErr) {
        if (dirErr) {
            return cb(dirErr);
        }
        fs.writeFile(self.path + self.additionalPath + '/app/settings.js', options.settingsContent, function () {
            tasks = [
                self.copyFiles(self.path + self.additionalPath).then(function () {
                    return Promise.all([
                        self.optiImage(self.path + self.additionalPath, '/build/resources', '/build/resources'),
                        self.createAppBuildConfig(self.path + self.additionalPath, self.includePaths)
                    ]);
                }).then(function () {
                    return self.uglifyMinify(self.path + self.additionalPath);
                }),
                self.clearIndex(self.path + self.additionalPath, options.appVersion),
                self.createConfig(self.path, self.path, self.appName, self.appVersion)
            ];

            Promise.all(tasks).then(function () {
                fs.move(self.path + self.additionalPath + '/build', self.path + '/build', function (moveErr) {
                    if (moveErr) {
                        return cb(moveErr);
                    }
                    fs.remove(self.path + self.additionalPath, function (removeErr) {
                        if (removeErr) {
                            return cb(removeErr);
                        }
                        fs.move(self.path + '/build', self.path + self.additionalPath, function (renameErr) {
                            if (renameErr) {
                                return cb(renameErr);
                            }
                            if (options.forAndroid || options.foriOS) {
                                tasks.length = 0;
                                var targetDir = self.path + '_build_' + self.getDate();

                                if (options.forAndroid) {
                                    tasks.push(buildAndroid(self.path, targetDir));
                                }
                                if (options.foriOS) {
                                    tasks.push(buildiOS(self.path, targetDir));
                                }
                                Promise.all(tasks).then(function () {
                                    fs.remove(self.path, function () {
                                        cb(null, path.normalize(targetDir));
                                    });
                                }, function (err) {
                                    cb(err);
                                });
                            } else {
                                cb();
                            }
                        });
                    });
                });
            }, cb);
        });
    });
};

module.exports = IonicCLIBuild;
