/* global require */
var remote = require('remote'),
    dialog = remote.require('dialog'),
    exec = require('child_process').exec,
    fs = require('fs-extra'),
    Imagemin = require('imagemin'),
    zipper = require('zip-local'),
    path = require('path'),
    Promise = require('bluebird'),

    Build = function () {
        'use strict';

        this.path = '';
        this.repoUrl = '';
        this.branch = '';
        this.cloned = false;
        this.checkedOut = false;
    };

function optiImage(basePath, src, dest) {
    'use strict';
    var ImageMin = new Imagemin();

    return new Promise(function (resolve, reject) {
        ImageMin
            .use(Imagemin.gifsicle({interlaced: true}))
            .use(Imagemin.jpegtran({progressive: true}))
            .use(Imagemin.optipng({optimizationLevel: 3}))
            .src(basePath + path.normalize(src + '/**/*.{gif,jpg,png,svg}'))
            .dest(basePath + path.normalize(dest))
            .run(function (err) {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
    });
}

function clearIndex(basePath) {
    'use strict';
    return new Promise(function (resolve, reject) {
        fs.readFile(basePath + '/index.html', {
            encoding: 'utf8'
        }, function (readErr, indexContent) {
            if (readErr) {
                return reject(readErr);
            }
            // change index.html
            indexContent = indexContent.replace('<script src="app/main.js"></script>', '');
            indexContent = indexContent.replace('<script src="lib/requirejs/requirejs.min.js"></script>', '');
            indexContent = indexContent.replace('<script src="app/boot.js"></script>', '<script src="app/app.min.js" type="text/javascript"></script>');

            fs.writeFile(basePath + '/build/index.html', indexContent, function (writeErr) {
                if (writeErr) {
                    return reject(writeErr);
                }
                resolve();
            });
        });
    });
}

function createConfig(basePath, name, version) {
    'use strict';
    return new Promise(function (resolve, reject) {
        fs.readFile(basePath + '/config.xml', {
            encoding: 'utf8'
        }, function (readErr, configContent) {
            if (readErr) {
                return reject(readErr);
            }
            // change config.xml
            configContent = configContent.replace(/\<name\>[^\<]*\<\/name\>/, '<name>' + name + '</name>');
            configContent = configContent.replace(/\<widget([^\>]*)versionCode\s*=\s*"[^\>"]*"([^\>]*)\>/, '<widget$1versionCode="' + version + '"$2>');
            configContent = configContent.replace(/\<widget([^\>]*)version\s*=\s*"[^\>"]*"([^\>]*)\>/, '<widget$1version="' + version + '"$2>');

            fs.writeFile(basePath + '/build/config.xml', configContent, function (writeErr) {
                if (writeErr) {
                    return reject(writeErr);
                }
                resolve();
            });
        });
    });
}

function uglyfyMinify(basePath) {
    'use strict';
    var rName = process.platform === 'win32' ? 'r.js.cmd' : 'r.js';

    return new Promise(function (resolve, reject) {
        exec(path.normalize('node_modules/.bin/' + rName) + ' -o ' + path.normalize(basePath + '/app.build.js'), function (rErr) {
            if (rErr) {
                return reject(rErr);
            }
            resolve();
        });
    });
}

function copy(src, dest) {
    'use strict';
    return new Promise(function (resolve, reject) {
        fs.copy(src, dest, function (err) {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

function copyFiles(basePath) {
    'use strict';
    var sources = ['app/templates'],
        i = 0,
        appBuildConfig = basePath + '/app.build.js',
        almond = './node_modules/almond/almond.js',
        tasks = [];

    for (i; i < sources.length; i = i + 1) {
        tasks.push(copy(basePath + '/' + sources[i], basePath + '/build/' + sources[i]));
    }
    tasks.push(copy(almond, basePath + '/almond.js'));
    tasks.push(copy('./app.build.js', appBuildConfig));

    return new Promise(function (resolve, reject) {
        Promise.all(tasks).then(resolve, reject);
    });
}

// show choose folder path window
Build.prototype.chooseFolder = function (cb) {
    'use strict';

    var self = this;

    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, function (paths) {
        if (paths && paths[0]) {
            self.path = paths[0];
        }
        cb(paths);
    });
};

// clone project to chosen folder
Build.prototype.cloneProject = function (folderPath, repoUrl, name, cb) {
    'use strict';

    this.path = folderPath || this.path;
    this.repoUrl = repoUrl || this.repoUrl;
    this.name = name || this.name;

    if (!this.path || !this.repoUrl || !this.name) {
        if (cb) {
            return cb('missing params');
        }
        return cb();
    }

    var self = this;

    exec('git --version', function (err, stdout) {
        if (stdout.match(/git version/g)) {
            exec('cd ' + self.path + ' && git clone ' + self.repoUrl, function (cloneErr) {
                if (!cloneErr) {
                    self.cloned = true;
                    self.path += '/' + self.name;
                } else {
                    self.cloned = false;
                }
                cb(cloneErr);
            });
        } else {
            cb('no git');
        }
    });
};

// checkout branch of previously cloned repo
Build.prototype.checkoutBranch = function (branch, cb) {
    'use strict';

    this.branch = branch || this.branch;

    if (!this.path || !this.branch) {
        if (cb) {
            return cb('missing params');
        }
        return cb();
    }

    var self = this;

    exec('git --version', function (err, stdout) {
        if (stdout.match(/git version/g)) {
            exec('cd ' + self.path + ' && git checkout -b ' + self.branch + '_build' + ' origin/' + self.branch, function (checkoutErr) {
                if (!checkoutErr) {
                    self.checkedOut = true;
                } else {
                    self.checkedOut = false;
                }
                cb(checkoutErr);
            });
        } else {
            cb('no git');
        }
    });
};

// checkout branch of previously cloned repo
Build.prototype.removeProject = function (cb) {
    'use strict';

    if (!this.path || !this.cloned) {
        return cb();
    }

    fs.remove(this.path, function () {
        cb();
    });
};

// create build directory
Build.prototype.build = function (name, version, cb) {
    'use strict';

    var self = this;

    if (!name || !version) {
        return cb();
    }
    self.appName = name;
    self.appVersion = version;

    if (!this.path || !this.cloned || !this.checkedOut) {
        return cb();
    }

    fs.mkdirs(this.path + '/build', function (dirErr) {
        if (dirErr) {
            return cb(dirErr);
        }
        Promise.all([
            copyFiles(self.path).then(function () {
                return uglyfyMinify(self.path);
            }),
            optiImage(self.path, '/resources', '/build/resources'),
            clearIndex(self.path),
            createConfig(self.path, self.appName, self.appVersion)
        ]).then(function () {
            zipper.zip(path.normalize(self.path + '/build'), function (zipped) {
                zipped.compress();
                zipped.save(path.normalize(self.path + '.zip'));
                fs.remove(self.path, function () {
                    cb();
                });
            });
        }, cb);
    });
};
