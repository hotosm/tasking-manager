'use strict';

(function () {

    angular.module('taskingManager', ['ngRoute', 'ngFileUpload', 'ng-showdown', 'ui.bootstrap', 'angularMoment', 'chart.js', 'ngTagsInput', 'mentio', '720kb.socialshare', 'pascalprecht.translate', 'ngTable', 'taskingmanager.config'])

    /**
     * Factory that returns the configuration settings for the current environment
     */
        .factory('configService', ['EnvironmentConfig', function (EnvironmentConfig) {
            var config = EnvironmentConfig;
            return config;
        }])

        // Check if user is logged in by checking available cookies
        .run(['accountService', 'authService', 'userPreferencesService', '$rootScope', function (accountService, authService, userPreferencesService, $rootScope) {

            $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
                $rootScope.title = current.$$route.title;
            });

            // Get session storage on application load
            var nameOfLocalStorage = authService.getLocalStorageSessionName();
            var sessionStorage = JSON.parse(localStorage.getItem(nameOfLocalStorage));

            // TODO: call API (doesn't exist at the moment) to check if session token is valid
            if (sessionStorage) {
                authService.setSession(sessionStorage.sessionToken || '', sessionStorage.username || '');
                accountService.setAccount(sessionStorage.username);
            }

            // initialise the userPreferences service which provides an interface to the cookie which stores the
            // users defaults and preferences
            userPreferencesService.initialise();

        }])

        .config(['$routeProvider', '$locationProvider', '$httpProvider', 'ChartJsProvider', '$translateProvider', function ($routeProvider, $locationProvider, $httpProvider, ChartJsProvider, $translateProvider) {

            // Translate
            $translateProvider.useStaticFilesLoader({
                prefix: 'locale/',
                suffix: '.json'
            });
            $translateProvider.preferredLanguage('en');
            // This escapes HTML in the translation - see https://angular-translate.github.io/docs/#/guide/19_security
            $translateProvider.useSanitizeValueStrategy('escape');

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

            // Set showdown's default options
            showdown.setOption('openLinksInNewWindow', true);

            $routeProvider

                .when('/', {
                    templateUrl: 'app/home/home.html',
                    controller: 'homeController',
                    controllerAs: 'homeCtrl',
                    title: 'Home'
                })

                .when('/admin/create-project', {
                    templateUrl: 'app/admin/create-project/create-project.html',
                    controller: 'createProjectController',
                    controllerAs: 'createProjectCtrl',
                    reloadOnSearch: false,
                    title: 'Create Project'
                })

                .when('/admin/edit-project/:id', {
                    templateUrl: 'app/admin/edit-project/edit-project.html',
                    controller: 'editProjectController',
                    controllerAs: 'editProjectCtrl',
                    title: 'Edit Project'
                })

                .when('/admin/manage-priorities', {
                    templateUrl: 'app/admin/manage-priorities/manage-priorities.html',
                    controller: 'managePrioritiesController',
                    controllerAs: 'managePrioritiesCtrl'
                })


                .when('/about', {
                    templateUrl: 'app/about/about.html',
                    controller: 'aboutController',
                    controllerAs: 'aboutCtrl',
                    title: 'About'
                })

                .when('/learn', {
                    templateUrl: 'app/learn/learn.html',
                    title: 'Learn'
                })

                .when('/what-is-new', {
                    templateUrl: 'app/about/what-is-new.html',
                    title: 'What is new'
                })

                .when('/faq', {
                    templateUrl: 'app/about/faq.html',
                    title: 'FAQ'
                })

                .when('/contribute', {
                    templateUrl: 'app/contribute/contribute.html',
                    controller: 'contributeController',
                    controllerAs: 'contributeCtrl',
                    reloadOnSearch: false,
                    title: 'Contribute'
                })

                .when('/project/:id', {
                    templateUrl: 'app/project/project.html',
                    controller: 'projectController',
                    controllerAs: 'projectCtrl',
                    reloadOnSearch: false,
                    title: 'Project'
                })

                .when('/user/:id', {
                    templateUrl: 'app/profile/profile.html',
                    controller: 'profileController',
                    controllerAs: 'profileCtrl',
                    title: 'Profile'
                })

                .when('/authorized', {
                    templateUrl: 'app/login/authorized.html',
                    controller: 'authController',
                    controllerAs: 'authCtrl',
                    title: 'Authorized'
                })

                .when('/auth-failed', {
                    templateUrl: 'app/login/auth-failed.html',
                    title: 'Authorization Failed'
                })

                .when('/admin/licenses', {
                    templateUrl: 'app/admin/licenses/licenses.html',
                    controller: 'licensesController',
                    controllerAs: 'licensesCtrl',
                    title: 'Licenses'
                })

                .when('/admin/licenses/edit/:id', {
                    templateUrl: 'app/admin/licenses/license-edit.html',
                    controller: 'licenseEditController',
                    controllerAs: 'licenseEditCtrl',
                    title: 'Edit Licenses'
                })

                .when('/admin/dashboard', {
                    templateUrl: 'app/admin/dashboard/dashboard.html',
                    controller: 'dashboardController',
                    controllerAs: 'dashboardCtrl',
                    title: 'Dashboard'
                })

                .when('/project/:id/dashboard', {
                    templateUrl: 'app/project/project-dashboard.html',
                    controller: 'projectDashboardController',
                    controllerAs: 'projectDashboardCtrl',
                    title: 'Project Dashboard'
                })

                .when('/admin/users', {
                    templateUrl: 'app/admin/users/users.html',
                    controller: 'usersController',
                    controllerAs: 'usersCtrl',
                    title: 'Users'
                })

                .when('/inbox', {
                    templateUrl: 'app/message/inbox.html',
                    controller: 'inboxController',
                    controllerAs: 'inboxCtrl',
                    title: 'Inbox'
                })

                .when('/message/:id', {
                    templateUrl: 'app/message/message.html',
                    controller: 'messageController',
                    controllerAs: 'messageCtrl',
                    title: 'Messages'
                })

                .when('/login', {
                    templateUrl: 'app/login/login.html',
                    controller: 'loginController',
                    controllerAs: 'loginCtrl',
                    title: 'Login'
                })

                .when('/validate-email', {
                    templateUrl: 'app/profile/validate-email.html',
                    controller: 'validateEmailController',
                    controllerAs: 'validateEmailCtrl',
                    reloadOnSearch: false,
                    title: 'Validate Email'
                })

                .when('/404', {
                    templateUrl: 'app/404/404.html',
                    title: 'Not Found'
                })

                .otherwise({
                    redirectTo: '/404'
                });

            // Enable HTML5Mode which means URLS don't have ugly hashbangs in them
            $locationProvider.html5Mode(true);

        }]);
})();
