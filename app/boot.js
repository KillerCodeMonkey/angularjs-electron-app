// requires routes, config, run they implicit requiring the app
require([
    'jquery'
], function (jQuery) {
    'use strict';
    require([
        'angular',
        'routes',
        'config',
        'run'
    ], function (angular) {
        // Here you have to set your app name to bootstrap it manually
        angular.bootstrap(document, ['app']);
    });
});
