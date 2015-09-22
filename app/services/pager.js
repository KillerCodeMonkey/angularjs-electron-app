define([
    'app'
], function (app) {
    'use strict';

    app.service('pagerService', [
        function () {
            this.getPager = function (header) {
                var link = header('link'),
                    pager = {},
                    key,
                    subPart = [],
                    value,
                    parts = link.split(',');

                angular.forEach(parts, function (part) {
                    subPart = part.split('rel=');
                    key = subPart[1];
                    value = subPart[0].replace(/[\<\>\;\s]/g, '');
                    pager[key] = value;
                });

                return pager;
            };
        }
    ]);
});
