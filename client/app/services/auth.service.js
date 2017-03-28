(function () {
    'use strict';
    /**
     * @fileoverview This file provides a authentication service.
     */

    angular
        .module('taskingManager')
        .service('authService', ['$window', '$location', 'configService', 'accountService', authService]);

    function authService($window, $location, configService, accountService) {

        var sessionToken = '';
        var localStorageSessionName = 'session';
        var urlBeforeLoggingIn = '/';

        var service = {
            login: login,
            logout: logout,
            setSession: setSession,
            getAuthenticatedHeader: getAuthenticatedHeader,
            getLocalStorageSessionName: getLocalStorageSessionName,
            getUrlBeforeLoggingIn: getUrlBeforeLoggingIn
        };

        return service;

        /**
         * Login to OSM account 
         */
        function login(){
            // Get the current page the user is on and remember it so we can go back to it
            urlBeforeLoggingIn = $location.path();
            $window.location.href = configService.tmAPI + '/auth/login';
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
            var session = {
                sessionToken: token,
                username: username
            };
            localStorage.setItem(localStorageSessionName, JSON.stringify(session));
            var account = {
                username: username
            };
            accountService.setAccount(account);
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

        /**
         * Gets the local storage session name
         * @returns {string}
         */
        function getLocalStorageSessionName(){
            return localStorageSessionName;
        }

        /**
         * Return the URL from before logging in
         * @returns {string}
         */
        function getUrlBeforeLoggingIn(){
            return urlBeforeLoggingIn;
        }
    }
})();