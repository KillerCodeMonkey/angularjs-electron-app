define([
  'app',
  'services/gitlab',
  // Load Controllers here
  'controllers/App',
  'controllers/Base',
  'controllers/Dashboard',
  'controllers/Detail',
  'controllers/Login'
], function (app) {
  'use strict';
  // definition of routes
  app.config([
    '$stateProvider',
    '$urlRouterProvider',
    '$loadingOverlayConfigProvider',
    function ($stateProvider, $urlRouterProvider, $loadingOverlayConfigProvider) {

      $loadingOverlayConfigProvider.defaultConfig('<div class="text-center"><i class="fa fa-refresh fa-spin"></i><br><b>Bitte Warten</b></div>');

      // url routes/states
      $urlRouterProvider.otherwise('login');

      $stateProvider
        // app states
        .state('login', {
            url: '/login',
            templateUrl: 'app/templates/login.html',
            controller: 'LoginCtrl'
        })
        .state('base', {
            url: '/',
            abstract: true,
            templateUrl: 'app/templates/base.html',
            controller: 'BaseCtrl'
        })
        .state('base.dashboard', {
            url: 'dashboard',
            templateUrl: 'app/templates/dashboard.html',
            controller: 'DashboardCtrl'
        });

    }
  ]);
});
