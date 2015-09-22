// requires routes, config, run they implicit requiring the app
require([
    'angular',
    'routes',
    'config',
    'run'
], function (angular) {
    'use strict';
    // Here you have to set your app name to bootstrap it manually
    angular.bootstrap(document, ['app']);
});
