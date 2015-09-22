/*globals define, Image*/
define([
    'app'
], function (app) {

    'use strict';

    app.directive('loadingSpinner', [
        function () {
            return {
                scope: {
                    loading: '=loading',
                    loadingText: '@?'
                },
                transclude: true,
                restrict: 'E',
                template: '<div ng-transclude="" ng-if="!loading"></div><div ng-if="loading"><p ng-if="loadingText" class="text-center uppercase"><br>{{loadingText}}</p><div class="fa fa-refresh fa-spin"></div></div>'
            };
        }
    ]);
});
