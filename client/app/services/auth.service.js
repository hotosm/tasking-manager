(function () {
    'use strict';
    /**
     * @fileoverview This file provides a authentication service.
     */

    angular
        .module('taskingManager')
        .service('authService', ['$window', '$location', 'configService', 'accountService', authService]);

    function authService($window, $location, configService, accountService) {

        var session = {};
        var sessionToken = '';
        var localStorageSessionName = 'session';

        var service = {
            login: login,
            logout: logout,
            setSession: setSession,
            getSession: getSession,
            getAuthenticatedHeader: getAuthenticatedHeader,
            getLocalStorageSessionName: getLocalStorageSessionName
        };

        return service;

        /**
         * Login to OSM account 
         */
        function login(){
            // Get the current page the user is on and remember it so we can go back to it
            var urlBeforeLoggingIn = $location.path();
            $window.location.href = configService.tmAPI + '/auth/login?redirect=' + urlBeforeLoggingIn;
        }
        
        /**
         * Log the user out by resetting the local storage ('cookies')
         */
         function logout(){
            localStorage.removeItem(localStorageSessionName);
            setSession('', '');
        }

        /**
         * Sets the session in localStorage ('cookies') and the account details
         * @param token
         * @param username
         */
        function setSession(token, username){
            sessionToken = token;
            session = {
                sessionToken: token,
                username: username
            };
            localStorage.setItem(localStorageSessionName, JSON.stringify(session));
            accountService.setAccount(username);
        }

        /**
         * Returns the session
         * @returns {*}
         */
        function getSession(){
            return session;
        }

        /**
         * Gets the authenticated header
         * @returns {{Content-Type: string, Authorization: string}}
         */
        function getAuthenticatedHeader(){

            var header = {
                'Content-Type': 'application/json; charset=UTF-8',
                'Authorization': 'Token ' + btoa(sessionToken)
            };
            return header;
        }

        /**
         * Gets the local storage session name
         * @returns {string}
         */
        function getLocalStorageSessionName(){
            return localStorageSessionName;
        }
    }
})();