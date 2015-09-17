var require = {
    baseUrl: 'app',
    paths: {
        'angular': '../lib/angularjs/angular.min',
        'ui-router': '../lib/angularjs/angular-ui-router.min'
    },
    shim: {
        'angular': {
            exports: 'angular'
        },
        'ui-router': {
            deps: ['angular']
        }
    }
};
