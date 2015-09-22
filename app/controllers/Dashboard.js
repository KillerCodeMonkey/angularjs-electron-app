define([
  'app',
  'services/gitlab'
], function (app) {
  'use strict';

  app.controller('DashboardCtrl', [
    '$scope',
    'gitlabService',
    'localStorageService',
    function ($scope, gitlabService, localStorageService) {
        $scope.privateToken = localStorageService.get('privateToken');

        gitlabService.getProjects().then(function (projects) {
            $scope.projects = projects;
            console.log(projects.pager);
        });

        $scope.load = function (url) {
            gitlabService.getProjects(url).then(function (projects) {
                $scope.projects = projects;
            });
        };
    }
  ]);
});
