// The main app definition
// --> where you should load other module depdendencies
define([
  'angular',
  'ui-bootstrap',
  'ui-router',
  'angular-local-storage',
  'ng-loading-overlay'
], function (angular) {
  'use strict';

  // the app with its used plugins
  var app = angular.module('app', [
    'ui.router',
    'LocalStorageModule',
    'ui.bootstrap',
    'ngLoadingOverlay'
  ]);
  // return the app so you can require it in other components
  return app;
});
