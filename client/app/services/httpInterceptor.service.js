(function () {
    'use strict';
    /**
     * @fileoverview This file provides a httpInterceptor service.
     * This service intercepts responses before they are handed over to the application code that
     * initiated these requests.
     * https://docs.angularjs.org/api/ng/service/$http (chapter Interceptors)
     */

    angular
        .module('taskingManager')
        .factory('httpInterceptorService', ['$q','$location', '$window', 'configService', httpInterceptorService]);

    function httpInterceptorService($q, $location, $window, configService) {

        return {

            // Returns a successful response
            'response': function (response) {
                return response;
            },

            // Redirects to the login page upon catching a 401 response error and reject all other responses
            'responseError': function (rejection) {
                if (rejection.status === 401) {
                    // Get the current page the user is on and remember it so we can go back to it
                    // Can't use the authService because of a circular dependency
                    console.log("401!");
                    var currentUrl = $location.path();
                    //$window.location.href = configService.tmAPI + '/auth/login?redirect_to=' + urlBeforeLoggingIn;
                    $location.path('/login/').search({redirect_to : currentUrl});
                }
                return $q.reject(rejection);
            }
        };
    }
})();