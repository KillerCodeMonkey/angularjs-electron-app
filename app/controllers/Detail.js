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
            var buildObject = new Build();

            $scope.isLoading = true;
            $scope.form = {
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
                                $scope.checkedOut = true;
                                $scope.form.build.settings = fileContents.settings;
                                $scope.form.build.config = fileContents.build;
                                $timeout(function () {
                                    if ($scope.form.build.config && $scope.form.build.config.appName) {
                                        $scope.form.build.appName = $scope.form.build.config.appName;
                                    }
                                    if ($scope.project.tags && $scope.project.tags[0]) {
                                        $scope.form.build.appVersion = $scope.project.tags[0].name;
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
                buildObject.build($scope.form.build.type, $scope.form.build.appName, $scope.form.build.appVersion, $scope.form.build.settings, $scope.form.build.host, $scope.form.build.android, $scope.form.build.ios, function (someError, zipPath) {
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
                if ($scope.checkedOut) {
                    build();
                } else {
                    checkout();
                }
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
