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
                    type: 'app'
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

            function checkout() {
                var repoUrl = $scope.project.http_url_to_repo.replace('https://', '');
                repoUrl = 'https://' + localStorageService.get('username') + ':' + $scope.form.build.password + '@' + repoUrl;

                $loadingOverlay.show();
                buildObject.cloneProject($scope.form.build.path, repoUrl, $scope.project.name, function (cloneErr) {
                    if (cloneErr) {
                        return $timeout(function () {
                            $loadingOverlay.hide();
                        });
                    }
                    buildObject.checkoutBranch($scope.form.build.branch, function (checkoutErr) {
                        if (checkoutErr) {
                            buildObject.removeProject(function () {
                                return $timeout(function () {
                                    $loadingOverlay.hide();
                                });
                            });
                        } else {
                            $timeout(function () {
                                $scope.checkedOut = true;
                                $loadingOverlay.hide();
                            });
                        }
                    });
                });
            }
            function build() {
                $loadingOverlay.show();
                buildObject.build('TROIKA', '010090', function (someError) {
                    if (someError) {
                        $timeout(function () {
                            $loadingOverlay.hide();
                        });
                    } else {
                        $timeout(function () {
                            $loadingOverlay.hide();
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
        }
    ]);
});
