/* global require */
var remote = require('remote'),
    dialog = remote.require('dialog'),
    exec = require('child_process').exec,
    Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs-extra')),
    Imagemin = require('imagemin'),
    path = require('path'),
    minify = require('html-minifier').minify;

// Build class
function Build() {
    'use strict';

    this.path = '';
    this.repoUrl = '';
    this.branch = '';
    this.includePaths = [];
    this.cloned = false;
    this.checkedOut = false;
}

// create date string
Build.prototype.getDate = function () {
    'use strict';
    var now = new Date();
    var todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()));

    return todayUTC.toISOString().slice(0, 10).replace(/-/g, '-') + 'T' + now.getHours() + '_' + now.getMinutes() + '_' + now.getSeconds();
};

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

function transformTemplate(basePath, templatePath) {
    'use strict';
    var templateContent,
        relativePath = templatePath.replace(basePath + '/', '');

    return new Promise(function (resolve, reject) {
        fs.readFile(templatePath, function (err, content) {
            if (err) {
                return reject(err);
            }

            templateContent = '<script type="text/ng-template" id="' + relativePath + '">\n' + content + '\n</script>';

            resolve(templateContent);
        });
    });
}

// concat all templates to on
function concatTemplates(basePath) {
    'use strict';
    var templates = [],
        tasks = [],
        i = 0,
        concatedContent = '';

    return new Promise(function (resolve, reject) {
        if (!basePath) {
            return reject('missing_basepath');
        }
        fs.stat(basePath, function (statErr) {
            if (statErr) {
                return reject();
            }
            readFiles(basePath + '/app/templates', templates);

            for (i; i < templates.length; i = i + 1) {
                tasks.push(transformTemplate(basePath, templates[i]));
            }

            Promise.all(tasks).then(function (contents) {
                concatedContent = contents.join('\n');
                resolve(concatedContent);
            }, reject);
        });
    });
}

// optimize images
Build.prototype.optiImage = function (basePath, src, dest) {
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
};
// clean up index.html
Build.prototype.clearIndex = function (basePath, appVersion) {
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
            appVersion = appVersion ? '\n<script>window.appVersion = "' + appVersion + '";</script>' : '';
            indexContent = indexContent.replace('<script src="lib/requirejs/requirejs.min.js"></script>', appVersion);
            // replace boot.js with bundle
            indexContent = indexContent.replace('<script src="app/boot.js"></script>', '<script src="app/app.min.js" type="text/javascript"></script>');
            concatTemplates(basePath).then(function (concatedTemplates) {
                indexContent = indexContent.replace('</body>', concatedTemplates + '\n</body>');
                var minifiedIndex = minify(indexContent, {
                    removeComments: true,
                    collapseWhitespace: true,
                    conservativeCollapse: true,
                    removeAttributeQuotes: true,
                    preserveLineBreaks: true
                });
                // write index.html to build
                fs.writeFile(basePath + '/build/index.html', minifiedIndex, function (writeErr) {
                    if (writeErr) {
                        return reject(writeErr);
                    }
                    resolve();
                });
            });
        });
    });
};

// run r-command for optimization
Build.prototype.uglifyMinify = function (basePath) {
    'use strict';

    var rName = process.platform === 'win32' ? 'r.js.cmd' : 'r.js';

    return new Promise(function (resolve, reject) {
        exec(path.normalize('node_modules/.bin/' + rName) + ' -o ' + path.normalize(basePath + '/app.build.js'), function (rErr, stdOut) {
            if (rErr) {
                return reject(stdOut);
            }
            resolve();
        });
    });
};

// create app.build.js --> config for r.js optimizing
Build.prototype.createAppBuildConfig = function (basePath, includePaths) {
    'use strict';
    var appBuildConfig = basePath + '/app.build.js',
        pathString;
    // include the predefined dicts folder
    readFiles(basePath + '/app/dicts', includePaths);

    // build string with additional files
    includePaths.forEach(function (includePath) {
        includePath = includePath.replace(basePath + '/app/', '');
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
};

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
Build.prototype.copyFiles = function (basePath) {
    'use strict';
    var sources = ['resources', 'docker-compose.yml'],
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
};

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
            exec('cd ' + self.path + ' && git clone --depth 1 ' + self.repoUrl, function (cloneErr) {
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
Build.prototype.checkoutBranch = function (branch, buildType, cb) {
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
                    Promise.settle([fs.readFileAsync(self.path + self.additionalPath + '/app/settings.js', 'utf8'), fs.readFileAsync(self.path + '/build.json', 'utf8')]).then(function (results) {
                        self.checkedOut = true;

                        cb(null, {
                            settings: results[0].isRejected() ? '' : results[0].value(),
                            build: results[1].isRejected() ? {} : JSON.parse(results[1].value())
                        });
                    });
                } else {
                    console.log(checkoutErr);
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
Build.prototype.build = function (options, cb) {
    'use strict';

    options = options || {};

    cb();
};

module.exports = Build;
