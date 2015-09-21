var require = {
    baseUrl: 'app',
    paths: {
        'jquery': '../node_modules/jquery/dist/jquery.min',
        'angular': '../node_modules/angular/angular.min',
        'ui-router': '../node_modules/angular-ui-router/release/angular-ui-router.min',
        'angular-local-storage': '../node_modules/angular-local-storage/dist/angular-local-storage.min',
        'ui-bootstrap': '../node_modules/angular-ui-bootstrap/ui-bootstrap.min'
    },
    shim: {
        'jquery': {
            exports: 'jQuery'
        },
        'angular': {
            exports: 'angular',
            deps: ['jquery']
        },
        'ui-router': {
            deps: ['angular']
        },
        'angular-local-storage': {
            deps: ['angular']
        },
        'ui-bootstrap': {
            deps: ['angular', 'jquery'],
            exports: 'uibs'
        }
    }
};
