/* global require */
var remote = require('remote'),
    dialog = remote.require('dialog'),
    exec = require('child_process').exec,
    fs = require('fs-extra'),
    amdclean = require('amdclean'),
    Imagemin = require('imagemin'),
    path = require('path'),

    Build = function () {
        'use strict';

        this.path = '';
        this.repoUrl = '';
        this.branch = '';
        this.cloned = false;
        this.checkedOut = false;
    };

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
Build.prototype.cloneProject = function (path, repoUrl, name, cb) {
    'use strict';

    this.path = path || this.path;
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
Build.prototype.createAndCopy = function (cb) {
    'use strict';

    var self = this;

    if (!this.path || !this.cloned || !this.checkedOut) {
        return cb();
    }

    fs.mkdirs(this.path + '/build', function (dirErr) {
        var sources = ['app/templates', 'lib', 'resources', 'config.xml', 'index.html'],
            i = 0,
            copyError;

        if (!dirErr) {
            for(i; i < sources.length; i = i + 1) {
                copyError = fs.copySync(self.path + '/' + sources[i], self.path + '/build/' + sources[i]);
            }
            if (copyError) {
                return cb(copyError);
            }
            var ImageMin = new Imagemin();
            ImageMin
                .use(Imagemin.gifsicle({interlaced: true}))
                .use(Imagemin.jpegtran({progressive: true}))
                .use(Imagemin.optipng({optimizationLevel: 3}))
                .src(self.path + path.normalize('/build/resources/**/*.{gif,jpg,png,svg}'))
                .dest(self.path + path.normalize('/build/resources'))
                .run(function (err) {
                    if (err) {
                        return cb(err);
                    }
                    exec(path.normalize('node_modules/.bin/r.js.cmd -o ') + path.normalize(self.path) + path.normalize('/app.build.js'), function (rErr) {
                        if (rErr) {
                            return cb(rErr);
                        }
                        var cleanedCode = amdclean.clean({
                            'filePath': path.normalize(self.path) + path.normalize('/build/app/app.min.js')
                        });
                        fs.writeFileSync(path.normalize(self.path) + path.normalize('/build/app/app.min.js'), cleanedCode);

                        cb();
                    });
                });
        } else {
            cb(dirErr);
        }
    });
};
