define([
    'app',
    'jquery'
], function (app, $) {
    'use strict';

    app.directive('sideMenu', [
        function () {
            return {
                restrict: 'A',
                link: function (element) {
                    $(element).metisMenu();
                }
            };
        }
    ]);
});
