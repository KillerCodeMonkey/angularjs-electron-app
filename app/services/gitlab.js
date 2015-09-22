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
                            'per_page': 20,
                            'order_by': 'last_activity_at',
                            'sort': 'desc'
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

            this.searchProjects = function (query, url) {
                url = settings.gitLab + 'projects';
                var deferred = $q.defer(),
                    options = {
                        url: url,
                        headers: {
                            'PRIVATE-TOKEN': localStorageService.get('privateToken')
                        },
                        params: {
                            'search': query,
                            'per_page': 20,
                            'order_by': 'last_activity_at',
                            'sort': 'desc'
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

            this.getProject = function (id) {
                var deferred = $q.defer(),
                    options = {
                        url: settings.gitLab + 'projects/' + id,
                        headers: {
                            'PRIVATE-TOKEN': localStorageService.get('privateToken')
                        },
                        method: 'get'
                    };

                $http(options).then(function (project) {
                    options.url += '/repository/branches';
                    $http(options).then(function (branches) {
                        var result = project.data;
                        result.branches = branches.data;
                        deferred.resolve(result);
                    }, deferred.reject);
                }, deferred.reject);

                return deferred.promise;
            };

            this.logout = function () {
                localStorageService.remove('privateToken');
                localStorageService.remove('username');
                localStorageService.remove('avatar');
            };
        }
    ]);
});
