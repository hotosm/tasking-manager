(function () {
    'use strict';
    /**
     * @fileoverview This file provides a authentication service.
     */

    angular
        .module('taskingManager')
        .service('authService', ['$window', '$http', '$q', 'configService','$location', authService]);

    function authService($window, $http, $q, configService, $location) {

        var sessionToken = '';

        var service = {
            login: login,
            logout: logout,
            setSessionToken: setSessionToken,
            getAuthenticatedHeader: getAuthenticatedHeader
        };

        return service;

        /**
         * Login to OSM account 
         */
        function login(){
            $window.location.href = configService.tmAPI + '/auth/login'
        }
        
        /**
         * Log the user out by resetting the local storage ('cookies')
         */
         function logout(){
            // TODO
        }

        /**
         * Sets the session token
         * @param token
         */
        function setSessionToken(token){
            sessionToken = token;
        }

        /**
         * Gets the authenticated header
         * @returns {{Content-Type: string, Authorization: string}}
         */
        function getAuthenticatedHeader(){

            var header = {
                'Content-Type': 'application/json; charset=UTF-8',
                'Authorization': 'Token ' + btoa(sessionToken + ':' + '')
            };
            return header;
        }
    }
})();