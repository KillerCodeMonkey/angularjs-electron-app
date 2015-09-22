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
        gitlabService.getProjects().then(function (projects) {
            $scope.projects = projects;
            $scope.privateToken = localStorageService.get('privateToken');
            console.log(projects);
        });
    }
  ]);
});
