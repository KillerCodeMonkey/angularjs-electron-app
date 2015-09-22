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
        'localStorageService',
        'gitlabService',
        'id',
        function ($q, $location, $state, $scope, $modalInstance, localStorageService, gitlabService, id) {
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
                App.chooseFolder(function (path) {
                    $scope.$apply(function () {
                        $scope.form.build.path = path.length ? path[0] : null;
                    });
                });
            };

            $scope.build = angular.noop;
        }
    ]);
});
