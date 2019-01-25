'use strict';

var geoprocessingScript = function(e) {
    if( 'function' === typeof importScripts) {
        if (e.data[0] === 'findExtent') {
            var taskGeometries = e.data[1];
            var extent = turf.bbox(taskGeometries);
            var bboxPolygon = turf.bboxPolygon(extent);
            self.postMessage({
                type: 'findExtent',
                extent: bboxPolygon,
            });
        } else if (e.data[0] === 'clipTaskDataAndFilter') {
            var taskGridGeoJSON = e.data[1];
            var taskGeometries = e.data[2];
            var numTaskGrids = taskGridGeoJSON.features.length;
            var idx = 0;
            var filteredGrid = taskGridGeoJSON.features.filter(function (taskGridFeature) {
                try {
                    var clippedFeatures = [];
                    var bbox = turf.bbox(taskGridFeature);
                    idx++;
                    taskGeometries.features.forEach(function (taskGeometry) {
                        if (taskGeometry.geometry && taskGeometry.geometry.type === 'Point') {
                            var inside = turf.inside(taskGeometry, taskGridFeature);
                            if (inside) {
                                clippedFeatures.push(taskGeometry)
                            }
                        } else {
                            // Sometimes we get invalid polygon data (lines that have type polygon).
                            // Try to detect those simple types and check each geometry point individually
                            if (taskGeometry.geometry.type === 'Polygon' && taskGeometry.geometry.coordinates.length < 4) {
                                var isInside = taskGeometry.geometry.coordinates.some(function (coords) {
                                    return coords.some(function (coord) {
                                                                                return turf.inside(turf.point(coord), taskGridFeature);
                                    })
                                });
                                if (isInside) {
                                    clippedFeatures.push(taskGeometry);
                                }
                            } else {
                                var clip = turf.bboxClip(taskGeometry, bbox);
                                if (clip.geometry.coordinates.length > 0) {
                                    clippedFeatures.push(clip);
                                }
                            }
                        }

                    });

                    self.postMessage({
                        type: 'progress',
                        progress: idx / numTaskGrids
                    });

                    if (clippedFeatures.length > 0) {
                        var taskObject = {
                            type: "FeatureCollection",
                            features: clippedFeatures
                        };
                        taskGridFeature.properties.taskGeometry = JSON.stringify(taskObject);
                        return true
                    }
                    return false;
                } catch (err) {
                    self.postMessage({
                        type: 'error',
                        error: err.toString()
                    });
                }
            });

            self.postMessage({
                type: 'clipTaskDataAndFilter',
                taskGeometry: filteredGrid
            });
        }
    }
};

(function () {

    angular.module('taskingManager', ['ngRoute', 'ngFileUpload', 'ng-showdown', 'ui.bootstrap', 'angularMoment', 'chart.js', 'ngTagsInput', 'mentio', '720kb.socialshare', 'pascalprecht.translate', 'taskingmanager.config'])

    /**
     * Factory that returns the configuration settings for the current environment
     */
        .factory('configService', ['EnvironmentConfig', function (EnvironmentConfig) {
            var config = EnvironmentConfig;
            return config;
        }])

        .factory("geoprocessingWorker",['$q',function($q) {
            var workerScript = 'if( \'undefined\' === typeof window){onmessage=' + geoprocessingScript.toString() + '}';
            var blob = new Blob([workerScript], {type: 'application/javascript'});
            var worker = new Worker(URL.createObjectURL(blob));
            var defer = $q.defer();

            worker.addEventListener('message', function(e) {
                if(e.data.type === 'progress') {
                    defer.notify(e.data)
                } else if (e.data.type === 'error') {
                    defer.reject(e.data.error);
                } else {
                    defer.resolve(e.data);
                }
            }, false);

            return {
                findExtent: function(taskGeometries) {
                    defer = $q.defer();
                    worker.postMessage(['findExtent', taskGeometries]); // Send data to our worker.
                    return defer.promise;
                },
                clipTaskDataAndFilter: function(taskGrid, taskGeometries) {
                    defer = $q.defer();
                    worker.postMessage(['clipTaskDataAndFilter', taskGrid, taskGeometries]); // Send data to our worker.
                    return defer.promise;
                }
            };
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
