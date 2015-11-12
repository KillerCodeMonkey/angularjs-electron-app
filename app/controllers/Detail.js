/* global define, Build */
define([
    'app',
    'services/gitlab',
    'directives/loadingSpinner'
], function (app) {
    'use strict';

    app.controller('DetailCtrl', [
        '$q',
        '$location',
        '$state',
        '$scope',
        '$timeout',
        '$modalInstance',
        '$loadingOverlay',
        'localStorageService',
        'gitlabService',
        'id',
        function ($q, $location, $state, $scope, $timeout, $modalInstance, $loadingOverlay, localStorageService, gitlabService, id) {
            var buildObject;

            $scope.isLoading = true;
            $scope.form = {
                step: 1,
                buildForm: {},
                build: {
                    type: 'app',
                    includeFiles: [],
                    buildType: 'pgb'
                }
            };

            gitlabService.getProject(id).then(function (res) {
                $scope.project = res;
            }).finally(function () {
                $scope.isLoading = false;
            });

            $scope.cancel = function () {
                $modalInstance.dismiss();
            };

            $scope.chooseDestination = function () {
                buildObject.chooseFolder(function (path) {
                    if (path) {
                        $scope.$apply(function () {
                            $scope.form.build.path = path.length ? path[0] : null;
                        });
                    }
                });
            };

            $scope.chooseIncludeFiles = function () {
                buildObject.chooseIncludeFiles(function (paths) {
                    if (paths && paths.length) {
                        $scope.$apply(function () {
                            $scope.form.build.includeFiles = $scope.form.build.includeFiles.concat(paths);
                        });
                    }
                });
            };

            $scope.removeIncludeFile = function (index) {
                if ($scope.form.build.includeFiles[index]) {
                    $scope.form.build.includeFiles.splice(index, 1);
                    buildObject.includePaths.splice(index, 1);
                }
            };

            function checkout() {
                var repoUrl = $scope.project.http_url_to_repo.replace('https://', '');
                repoUrl = 'https://' + localStorageService.get('username') + ':' + $scope.form.build.password + '@' + repoUrl;

                $loadingOverlay.show();
                buildObject.cloneProject($scope.form.build.path, repoUrl, $scope.project.name, function (cloneErr) {
                    if (cloneErr) {
                        console.log(cloneErr);
                        return $timeout(function () {
                            $loadingOverlay.hide();
                        });
                    }
                    buildObject.checkoutBranch($scope.form.build.branch, $scope.form.build.buildType, function (checkoutErr, fileContents) {
                        if (checkoutErr) {
                            buildObject.removeProject(function () {
                                return $timeout(function () {
                                    $loadingOverlay.hide();
                                });
                            });
                        } else {
                            $timeout(function () {
                                $scope.form.step = 3;
                                $scope.form.build.settings = fileContents.settings;
                                $scope.form.build.config = fileContents.build;
                                $timeout(function () {
                                    if ($scope.form.build.config && $scope.form.build.config.appName) {
                                        $scope.form.build.appName = $scope.form.build.config.appName;
                                    }
                                    if ($scope.project.tags && $scope.project.tags[0]) {
                                        $scope.form.build.appVersion = $scope.project.tags[0].name;
                                    }
                                    if ($scope.form.build.config && $scope.form.build.config.bundleID) {
                                        $scope.form.build.bundleID = $scope.form.build.config.bundleID;
                                    }
                                });

                                $loadingOverlay.hide();
                            });
                        }
                    });
                });
            }
            function build() {
                $loadingOverlay.show();
                buildObject.build({
                    appName: $scope.form.build.appName,
                    appVersion: $scope.form.build.appVersion,
                    bundleID: $scope.form.build.bundleID,
                    settingsContent: $scope.form.build.settings,
                    host: $scope.form.build.host,
                    forAndroid: $scope.form.build.android,
                    foriOS: $scope.form.build.ios
                }, function (someError, zipPath) {
                    if (someError) {
                        console.log(someError);
                        $timeout(function () {
                            $loadingOverlay.hide();
                        });
                    } else {
                        $timeout(function () {
                            $loadingOverlay.hide();
                            $scope.success = true;
                            $scope.form.build.packagePath = zipPath;
                        });
                    }
                });
            }

            $scope.action = function () {
                // create correct build object
                if ($scope.form.step === 1) {
                    $scope.form.step = 2;
                    if ($scope.form.build.type === 'app') {
                        buildObject = $scope.form.build.buildType === 'pgb' ? new PhoneGapBuild() : new IonicCLIBuild();
                        return;
                    }
                    buildObject = new WebAppBuild();
                    return;
                }
                // checkout project
                if ($scope.form.step === 2) {
                    return checkout();
                }
                // start build
                return build();
            };

            $scope.changeHost = function () {
                if (!$scope.form.build.host) {
                    return;
                }
                if ($scope.form.build.host !== 'live') {
                    $scope.form.build.config.appName = $scope.form.build.config.appName + '_' + $scope.form.build.host;
                }
                $scope.form.build.settings = $scope.form.build.settings.replace(/host\s*:\s*[^\n]*?\n/g, '');
                $scope.form.build.settings = $scope.form.build.settings.replace('define({', 'define({\n    host: \'' + $scope.form.build.config.hosts[$scope.form.build.host] + '\',');
            };
        }
    ]);
});
