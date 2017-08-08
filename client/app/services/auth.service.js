(function () {
    'use strict';
    /**
     * @fileoverview This file provides a authentication service.
     */

    angular
        .module('taskingManager')
        .service('authService', ['$window', '$location', 'configService','languageService', authService]);

    function authService($window, $location, configService, languageService) {

        var session = {};
        var sessionToken = '';
        var localStorageSessionName = 'session';

        var service = {
            login: login,
            logout: logout,
            setSession: setSession,
            getSession: getSession,
            getAuthenticatedHeader: getAuthenticatedHeader,
            getLocalStorageSessionName: getLocalStorageSessionName,
            isUserLoggedIn: isUserLoggedIn
        };

        return service;

        /**
         * Login to OSM account 
         */
        function login(redirectURL){
            // Force a logout first by clearing the local storage. This prevents getting stuck in a loop with an
            // invalid/expired token. The GET user API is called if a token is there on loading the page, so also if
            // there was an invalid/expired one. By removing the token before logging in, it doesn't have an invalid
            // token when it returns from OpenStreetMap.
            logout();
            var urlBeforeLoggingIn = '';
            if (!redirectURL){
                // Get the current page the user is on and remember it so we can go back to it
                urlBeforeLoggingIn = $location.path();
            }
            else {
                urlBeforeLoggingIn = redirectURL;
            }
            $window.location.href = configService.tmAPI + '/auth/login?redirect_to=' + urlBeforeLoggingIn;
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

            var preferredLanguage = languageService.getLanguageCode();

            var header = {
                'Content-Type': 'application/json; charset=UTF-8',
                'Authorization': 'Token ' + btoa(sessionToken),
                'Accept-Language': preferredLanguage
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
         * Checks if the user is logged in
         */
        function isUserLoggedIn(){
            var isLoggedIn;
            if (session.username){
                isLoggedIn = true;
            }
            else {
                isLoggedIn = false;
            }
            return isLoggedIn;

        }
    }
})();