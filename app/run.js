define([
  'app',
  'dict/de'
], function (app, de) {
    'use strict';
    // the run blocks
    app.run([
        '$rootScope',
        function ($rootScope) {
            $rootScope.dict = de;
        }
    ]);
});
