'use strict';

(function () {

    angular.module('taskingManager', ['ngRoute', 'ngFileUpload', 'ng-showdown','ui.bootstrap', 'taskingmanager.config'])

        /**
         * Factory that returns the configuration settings for the current environment
         */
        .factory('configService', ['EnvironmentConfig', function (EnvironmentConfig) {
            var config = EnvironmentConfig;
            return config;
        }])

        .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

            $routeProvider

                .when('/', {
                    templateUrl: 'app/home/home.html'
                })

                .when('/admin/create-project', {
                    templateUrl: 'app/admin/create-project/create-project.html',
                    controller: 'createProjectController',
                    controllerAs: 'createProjectCtrl'
                })
                
                .when('/admin/edit-project', {
                    templateUrl: 'app/admin/edit-project/edit-project.html',
                    controller: 'editProjectController',
                    controllerAs: 'editProjectCtrl'
                })

                .when('/about', {
                    templateUrl: 'app/about/about.html'
                })

                .when('/learn', {
                    templateUrl: 'app/learn/learn.html'
                })

                .when('/contribute', {
                    templateUrl: 'app/contribute/contribute.html',
                    controller: 'contributeController',
                    controllerAs: 'contributeCtrl'
                })

                .when('/project', {
                    templateUrl: 'app/project/project.html',
                    controller: 'projectController',
                    controllerAs: 'projectCtrl'
                });
            
            // Enable HTML5Mode which means URLS don't have ugly hashbangs in them
            $locationProvider.html5Mode(true);
            
        }]);
})();