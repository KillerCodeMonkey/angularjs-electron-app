define([
  'app',
  'services/gitlab'
], function (app) {
  'use strict';

  app.controller('DashboardCtrl', [
    '$scope',
    '$loadingOverlay',
    '$modal',
    'gitlabService',
    'localStorageService',
    function ($scope, $loadingOverlay, $modal, gitlabService, localStorageService) {
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

        $scope.openDetails = function (id) {
            $modal.open({
                'templateUrl': 'app/templates/detail.html',
                controller: 'DetailCtrl',
                resolve: {
                    'id': id
                }
            });
        };
    }
  ]);
});
