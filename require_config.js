var require = {
    baseUrl: 'app',
    paths: {
        'jquery': '../node_modules/jquery/dist/jquery.min',
        'angular': '../node_modules/angular/angular.min',
        'ui-router': '../node_modules/angular-ui-router/release/angular-ui-router.min',
        'angular-local-storage': '../node_modules/angular-local-storage/dist/angular-local-storage.min',
        'bootstrap': '../node_modules/bootstrap/dist/js/bootstrap.min',
        'ui-bootstrap': '../node_modules/angular-ui-bootstrap/ui-bootstrap.min',
        'metis': '../node_modules/metismenu/dist/metisMenu.min'
    },
    shim: {
        'jquery': {
            exports: 'jQuery'
        },
        'metis': {
            deps: ['jquery']
        },
        'angular': {
            exports: 'angular',
            deps: ['jquery', 'metis']
        },
        'ui-router': {
            deps: ['angular']
        },
        'angular-local-storage': {
            deps: ['angular']
        },
        'bootstrap': {
            deps: ['jquery']
        },
        'ui-bootstrap': {
            deps: ['angular', 'jquery', 'bootstrap'],
            exports: 'uibs'
        }
    }
};
