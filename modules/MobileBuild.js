var Build = require('./Build'),
    Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs-extra'));

function MobileBuild () {
    Build.call(this);
}

// inherit everything from Build class
MobileBuild.prototype = new Build();
// create and change config.xml
MobileBuild.prototype.createConfig = function (basePath, targetPath, name, version) {
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
            if (configContent.match(/\<widget[^\>]*versionCode\s*=\s*"[^\>"]*"[^\>]*\>/) && !configContent.match(/\<widget[^\>]*versionName\s*=\s*"[^\>"]*"[^\>]*\>/)) {
                configContent = configContent.replace(/\<widget([^\>]*)versionCode\s*=\s*"[^\>"]*"([^\>]*)\>/, '<widget$1versionName="' + version + '"$2>');
            } else if (!configContent.match(/\<widget[^\>]*versionCode\s*=\s*"[^\>"]*"[^\>]*\>/) && configContent.match(/\<widget[^\>]*versionName\s*=\s*"[^\>"]*"[^\>]*\>/)) {
                configContent = configContent.replace(/\<widget([^\>]*)versionName\s*=\s*"[^\>"]*"([^\>]*)\>/, '<widget$1versionName="' + version + '"$2>');
            } else if (configContent.match(/\<widget[^\>]*versionCode\s*=\s*"[^\>"]*"[^\>]*\>/) && configContent.match(/\<widget[^\>]*versionName\s*=\s*"[^\>"]*"[^\>]*\>/)) {
                configContent = configContent.replace(/\<widget([^\>]*)versionName\s*=\s*"[^\>"]*"([^\>]*)\>/, '<widget$1versionName="' + version + '"$2>');
                configContent = configContent.replace(/\<widget([^\>]*)versionCode\s*=\s*"[^\>"]*"([^\>]*)\>/, '');
            }
            configContent = configContent.replace(/\<widget([^\>]*)version\s*=\s*"[^\>"]*"([^\>]*)\>/, '<widget$1version="' + version + '"$2>');
            // write new config.xml to build folder
            fs.writeFile(targetPath + '/config.xml', configContent, function (writeErr) {
                if (writeErr) {
                    return reject(writeErr);
                }
                resolve();
            });
        });
    });
};

module.exports = MobileBuild;
