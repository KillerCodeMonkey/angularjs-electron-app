define([
  'app',
  'services/gitlab'
], function (app) {
  'use strict';

  app.controller('DashboardCtrl', [
    '$scope',
    '$loadingOverlay',
    'gitlabService',
    'localStorageService',
    function ($scope, $loadingOverlay, gitlabService, localStorageService) {
        $scope.privateToken = localStorageService.get('privateToken');
        $loadingOverlay.show();
        gitlabService.getProjects().then(function (projects) {
            $scope.projects = projects;
        }).finally(function () {
            $loadingOverlay.hide();
        });

        $scope.load = function (url) {
            $loadingOverlay.show();
            gitlabService.getProjects(url).then(function (projects) {
                $scope.projects = projects;
            }).finally(function () {
                $loadingOverlay.hide();
            });
        };

        $scope.$on('search', function (event, searchString) {
            $loadingOverlay.show();
            gitlabService.searchProjects(searchString).then(function (projects) {
                $scope.projects = projects;
            }).finally(function () {
                $loadingOverlay.hide();
            });
        });
    }
  ]);
});
