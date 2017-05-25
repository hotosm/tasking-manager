'use strict';

(function () {

    angular.module('taskingManager', ['ngRoute', 'ngFileUpload', 'ng-showdown', 'ui.bootstrap', 'angularMoment', 'chart.js', 'ngTagsInput', 'mentio', '720kb.socialshare', 'pascalprecht.translate', 'taskingmanager.config'])

    /**
     * Factory that returns the configuration settings for the current environment
     */
        .factory('configService', ['EnvironmentConfig', function (EnvironmentConfig) {
            var config = EnvironmentConfig;
            return config;
        }])

        // Check if user is logged in by checking available cookies
        .run(['accountService', 'authService', function (accountService, authService) {

            // Get session storage on application load
            var nameOfLocalStorage = authService.getLocalStorageSessionName();
            var sessionStorage = JSON.parse(localStorage.getItem(nameOfLocalStorage));

            if (sessionStorage) {
                authService.setSession(sessionStorage.sessionToken || '', sessionStorage.username || '');
                accountService.setAccount(sessionStorage.username);
            }
        }])

        .config(['$routeProvider', '$locationProvider', '$httpProvider', 'ChartJsProvider', '$translateProvider', function ($routeProvider, $locationProvider, $httpProvider, ChartJsProvider, $translateProvider) {

            // Translate
            $translateProvider.useStaticFilesLoader({
                prefix: 'locale/',
                suffix: '.json'
            });
            $translateProvider.preferredLanguage('en');
            
            // Disable caching for requests. Bugfix for IE. IE(11) uses cached responses if these headers are not provided.
            $httpProvider.defaults.headers.common['Cache-Control'] = 'no-cache';
            $httpProvider.defaults.cache = false;

            if (!$httpProvider.defaults.headers.get) {
                $httpProvider.defaults.headers.get = {};
            }
            $httpProvider.defaults.headers.get['If-Modified-Since'] = '0';

             // Intercept the response errors and go to the login page if the status is 401
            $httpProvider.interceptors.push('httpInterceptorService');

            ChartJsProvider.setOptions({
                chartColors: ['#AC3232', '#DCDCDC', '#7A7A7A', '#595959']
            });
            
            $routeProvider

                .when('/', {
                    templateUrl: 'app/home/home.html'
                })

                .when('/admin/create-project', {
                    templateUrl: 'app/admin/create-project/create-project.html',
                    controller: 'createProjectController',
                    controllerAs: 'createProjectCtrl'
                })

                .when('/admin/edit-project/:id', {
                    templateUrl: 'app/admin/edit-project/edit-project.html',
                    controller: 'editProjectController',
                    controllerAs: 'editProjectCtrl'
                })

                .when('/about', {
                    templateUrl: 'app/about/about.html',
                    controller: 'aboutController',
                    controllerAs: 'aboutCtrl'
                })

                .when('/learn', {
                    templateUrl: 'app/learn/learn.html'
                })

                .when('/contribute', {
                    templateUrl: 'app/contribute/contribute.html',
                    controller: 'contributeController',
                    controllerAs: 'contributeCtrl'
                })

                .when('/project/:id', {
                    templateUrl: 'app/project/project.html',
                    controller: 'projectController',
                    controllerAs: 'projectCtrl',
                    reloadOnSearch: false
                })

                .when('/user/:id', {
                    templateUrl: 'app/profile/profile.html',
                    controller: 'profileController',
                    controllerAs: 'profileCtrl'
                })

                .when('/authorized', {
                    templateUrl: 'app/login/authorized.html',
                    controller: 'authController',
                    controllerAs: 'authCtrl'
                })

                .when('/auth-failed', {
                    templateUrl: 'app/login/auth-failed.html'
                })

                .when('/admin/licenses', {
                    templateUrl: 'app/admin/licenses/licenses.html',
                    controller: 'licensesController',
                    controllerAs: 'licensesCtrl'
                })

                .when('/admin/licenses/edit/:id', {
                    templateUrl: 'app/admin/licenses/license-edit.html',
                    controller: 'licenseEditController',
                    controllerAs: 'licenseEditCtrl'
                })

                .when('/admin/dashboard', {
                    templateUrl: 'app/admin/dashboard/dashboard.html',
                    controller: 'dashboardController',
                    controllerAs: 'dashboardCtrl'
                })

                .when('/project/:id/dashboard', {
                    templateUrl: 'app/project/project-dashboard.html',
                    controller: 'projectDashboardController',
                    controllerAs: 'projectDashboardCtrl'
                })

                .when('/admin/users', {
                    templateUrl: 'app/admin/users/users.html',
                    controller: 'usersController',
                    controllerAs: 'usersCtrl'
                })
            
                .when('/inbox', {
                    templateUrl: 'app/message/inbox.html',
                    controller: 'inboxController',
                    controllerAs: 'inboxCtrl'
                })

                .when('/message/:id', {
                    templateUrl: 'app/message/message.html',
                    controller: 'messageController',
                    controllerAs: 'messageCtrl'
                })
            
                .when('/login', {
                    templateUrl: 'app/login/login.html',
                    controller: 'loginController',
                    controllerAs: 'loginCtrl'
                })
            
                .when('/validate-email', {
                    templateUrl: 'app/profile/validate-email.html',
                    controller: 'validateEmailController',
                    controllerAs: 'validateEmailCtrl',
                    reloadOnSearch: false
                });

            // Enable HTML5Mode which means URLS don't have ugly hashbangs in them
            $locationProvider.html5Mode(true);

        }]);
})();