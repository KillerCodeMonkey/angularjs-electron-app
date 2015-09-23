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
        '$modalInstance',
        '$loadingOverlay',
        'localStorageService',
        'gitlabService',
        'id',
        function ($q, $location, $state, $scope, $modalInstance, $loadingOverlay, localStorageService, gitlabService, id) {
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
                        $loadingOverlay.hide();
                        return;
                    }
                    buildObject.checkoutBranch($scope.form.build.branch, function (checkoutErr) {
                        if (checkoutErr) {
                            console.log(checkoutErr);
                            buildObject.removeProject(function () {
                                $loadingOverlay.hide();
                                return;
                            });
                        } else {
                            $scope.checkedOut = true;
                            $loadingOverlay.hide();
                        }
                    });
                });
            }
            function build() {
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
