define([
    'app',
    'settings',
    'services/pager'
], function (app, settings) {
    'use strict';

    app.service('gitlabService', [
        '$q',
        '$http',
        'localStorageService',
        'pagerService',
        function ($q, $http, localStorageService, pagerService) {
            this.login = function (params) {
                var deferred = $q.defer();

                $http.post(settings.gitLab + 'session', params).then(function (res) {
                    localStorageService.set('privateToken', res.data.private_token);
                    localStorageService.set('username', res.data.username);
                    localStorageService.set('avatar', res.data.avatar_url);
                    deferred.resolve(res.data);
                }, deferred.reject);

                return deferred.promise;
            };

            this.me = function () {
                var deferred = $q.defer(),
                    options = {
                        url: settings.gitLab + 'user',
                        headers: {
                            'PRIVATE-TOKEN': localStorageService.get('privateToken')
                        },
                        method: 'get'
                    };


                $http(options).then(function (res) {
                    deferred.resolve(res.data);
                }, deferred.reject);

                return deferred.promise;
            };

            this.getProjects = function (url) {
                url = url || settings.gitLab + 'projects';
                var deferred = $q.defer(),
                    options = {
                        url: url,
                        headers: {
                            'PRIVATE-TOKEN': localStorageService.get('privateToken')
                        },
                        params: {
                            'per_page': 20
                        },
                        method: 'get'
                    };

                $http(options).then(function (res) {
                    deferred.resolve({
                        entries: res.data,
                        pager: pagerService.getPager(res.headers)
                    });
                }, deferred.reject);

                return deferred.promise;
            };
        }
    ]);
});
