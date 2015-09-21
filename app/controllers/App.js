define([
    'app',
    'services/gitlab'
], function (app) {
    'use strict';

    app.controller('AppCtrl', [
        '$q',
        '$location',
        '$state',
        'localStorageService',
        'gitlabService',
        function ($q, $location, $state, localStorageService, gitlabService) {
            gitlabService.me().then(function () {
                $state.go('base.dashboard');
            }, function () {
                $state.go('login');
            });
        }
    ]);
});
