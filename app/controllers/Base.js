define([
  'app',
  'services/gitlab',
  'directives/sideMenu'
], function (app) {
  'use strict';

  app.controller('BaseCtrl', [
    '$scope',
    '$state',
    'localStorageService',
    'gitlabService',
    function ($scope, $state, localStorageService, gitlabService) {
        $scope.avatar = localStorageService.get('avatar');
        $scope.privateToken = localStorageService.get('privateToken');
        $scope.logout = function () {
            gitlabService.logout();
            $state.go('login');
        };

        $scope.formatDate = function (dateString) {
            var date = new Date(dateString);
            return date.toLocaleDateString();
        };

        $scope.formatTime = function (dateString) {
            var date = new Date(dateString);
            return date.toLocaleTimeString();
        };

        $scope.search = function () {
            if ($scope.searchString) {
                $scope.$broadcast('search', $scope.searchString);
            }
        };
    }
  ]);
});
