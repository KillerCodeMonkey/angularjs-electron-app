/* global require */
var remote = require('remote'),
    dialog = remote.require('dialog'),
    exec = require('child_process').exec,
    Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs-extra')),
    Imagemin = require('imagemin'),
    zipper = require('zip-local'),
    path = require('path'),

    // Build class
    Build = function () {
        'use strict';

        this.path = '';
        this.repoUrl = '';
        this.branch = '';
        this.includePaths = [];
        this.cloned = false;
        this.checkedOut = false;
    };
// optimize images
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
// clean up index.html
function clearIndex(basePath) {
    'use strict';
    return new Promise(function (resolve, reject) {
        fs.readFile(basePath + '/index.html', {
            encoding: 'utf8'
        }, function (readErr, indexContent) {
            if (readErr) {
                return reject(readErr);
            }
            // remove requirejs-config, requirejs
            indexContent = indexContent.replace('<script src="app/main.js"></script>', '');
            indexContent = indexContent.replace('<script src="lib/requirejs/requirejs.min.js"></script>', '');
            // replace boot.js with bundle
            indexContent = indexContent.replace('<script src="app/boot.js"></script>', '<script src="app/app.min.js" type="text/javascript"></script>');
            // write index.html to build
            fs.writeFile(basePath + '/build/index.html', indexContent, function (writeErr) {
                if (writeErr) {
                    return reject(writeErr);
                }
                resolve();
            });
        });
    });
}
// create and change config.xml
function createConfig(basePath, name, version) {
    'use strict';
    return new Promise(function (resolve, reject) {
        fs.readFile(basePath + '/config.xml', {
            encoding: 'utf8'
        }, function (readErr, configContent) {
            if (readErr) {
                return reject(readErr);
            }
            // set app Name
            configContent = configContent.replace(/\<name\>[^\<]*\<\/name\>/, '<name>' + name + '</name>');
            // set app version
            configContent = configContent.replace(/\<widget([^\>]*)versionCode\s*=\s*"[^\>"]*"([^\>]*)\>/, '<widget$1versionCode="' + version + '"$2>');
            configContent = configContent.replace(/\<widget([^\>]*)version\s*=\s*"[^\>"]*"([^\>]*)\>/, '<widget$1version="' + version + '"$2>');
            // write new config.xml to build folder
            fs.writeFile(basePath + '/build/config.xml', configContent, function (writeErr) {
                if (writeErr) {
                    return reject(writeErr);
                }
                resolve();
            });
        });
    });
}

function readFiles(currentPath, target) {
    'use strict';

    if (!currentPath || !target) {
        return;
    }
    var files = fs.readdirSync(currentPath),
        currentFile,
        stats;

    for (var i in files) {
        currentFile = currentPath + '/' + files[i];
        stats = fs.statSync(currentFile);
        if (stats.isFile()) {
            target.push(currentFile);
        }
        else if (stats.isDirectory()) {
            readFiles(currentFile, target);
        }
    }
}

// run r-command for optimization
function uglifyMinify(basePath) {
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
// create app.build.js --> config for r.js optimizing
function createAppBuildConfig(basePath, includePaths) {
    'use strict';
    var appBuildConfig = basePath + '/app.build.js',
        pathString;

    readFiles(basePath + '/app/dicts', includePaths);

    // build string with additional files
    includePaths.forEach(function (includePath) {
        includePath = includePath.replace(path.normalize(basePath + '/app/'), '');
        includePath = includePath.replace(/\.js$/, '');
        if (includePath) {
            if (pathString) {
                pathString += ', ';
            } else {
                pathString = '';
            }
            pathString += '"' + includePath + '"';
        }
    });

    return new Promise(function (resolve, reject) {
        // no additional stuff --> write app.build.js
        if (!pathString) {
            return fs.copy('./app.build.js', appBuildConfig, function (writeErr) {
                if (writeErr) {
                    return reject(writeErr);
                }
                resolve();
            });
        }
        // read default app.build.js
        fs.readFile('./app.build.js', {
            encoding: 'utf8'
        }, function (readErr, configContent) {
            if (readErr) {
                return reject(readErr);
            }
            // extend include with additional sources
            configContent = configContent.replace(/include\s*:\s*\[([^\]]*)\]/, 'include: [$1, ' + pathString + ']');
            // write new file
            fs.writeFile(appBuildConfig, configContent, function (writeErr) {
                if (writeErr) {
                    return reject(writeErr);
                }
                resolve();
            });
        });
    });
}

function copy(src, dest) {
    'use strict';
    return new Promise(function (resolve, reject) {
        fs.stat(src, function (statErr) {
            if (statErr) {
                return resolve();
            }
            fs.copy(src, dest, function (err) {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

// copy necessary files to build folder and add almond to project
function copyFiles(basePath) {
    'use strict';
    var sources = ['app/templates', 'resources', 'docker-compose.yml'],
        i = 0,
        almond = './node_modules/almond/almond.js',
        tasks = [];

    for (i; i < sources.length; i = i + 1) {
        tasks.push(copy(basePath + '/' + sources[i], basePath + '/build/' + sources[i]));
    }
    tasks.push(copy(almond, basePath + '/almond.js'));

    return new Promise(function (resolve, reject) {
        Promise.all(tasks).then(resolve, reject);
    });
}

// show choose folder path window
Build.prototype.chooseFolder = function (cb) {
    'use strict';

    var self = this;
    // show dialog window
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, function (paths) {
        if (paths && paths[0]) {
            self.path = paths[0];
        }
        cb(paths);
    });
};

// show choose files to explicit include
Build.prototype.chooseIncludeFiles = function (cb) {
    'use strict';

    var self = this;
    // show dialog window
    dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections']
    }, function (paths) {
        if (paths && paths.length) {
            self.includePaths = paths;
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
                    // read settings.js
                    Promise.settle([fs.readFileAsync(self.path + '/app/settings.js', 'utf8'), fs.readFileAsync(self.path + '/build.json', 'utf8')]).then(function (results) {
                        self.checkedOut = true;

                        cb(null, {
                            settings: results[0].isRejected() ? '' : results[0].value(),
                            build: results[1].isRejected() ? {} : JSON.parse(results[1].value())
                        });
                    });
                } else {
                    self.checkedOut = false;
                    cb(checkoutErr);
                }
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
Build.prototype.build = function (type, name, version, settingsContent, host, cb) {
    'use strict';

    var self = this,
        tasks = [];

    if (!type || (type === 'app' && !(name && version))) {
        return cb();
    }
    self.appName = name;
    self.appVersion = version;
    self.host = host;

    if (!this.path || !this.cloned || !this.checkedOut) {
        return cb();
    }

    fs.mkdirs(this.path + '/build/app', function (dirErr) {
        if (dirErr) {
            return cb(dirErr);
        }
        fs.writeFile(self.path + '/app/settings.js', settingsContent, function () {
            tasks = [
                copyFiles(self.path).then(function () {
                    return Promise.all([
                        optiImage(self.path, '/build/resources', '/build/resources'),
                        createAppBuildConfig(self.path, self.includePaths)
                    ]);
                }).then(function () {
                    return uglifyMinify(self.path);
                }),
                clearIndex(self.path)
            ];

            if (type === 'app') {
                tasks.push(createConfig(self.path, self.appName, self.appVersion));
            }

            Promise.all(tasks).then(function () {
                zipper.zip(path.normalize(self.path + '/build'), function (zipped) {
                    zipped.compress();
                    zipped.save(path.normalize(self.path + '.zip'));
                    fs.remove(self.path, function () {
                        self.package = path.normalize(self.path + '.zip');
                        cb(null, path.normalize(self.path + '.zip'));
                    });
                });
            }, cb);
        });
    });
};
