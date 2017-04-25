(function () {
    'use strict';
    /**
     * @fileoverview This file provides a account service.
     */

    angular
        .module('taskingManager')
        .service('accountService', ['$http', '$q','configService', accountService]);

    function accountService($http, $q, configService) {

        var account = {
            username: '',
            role: '',
            mappingLevel: ''
        };

        var service = {
            setAccount: setAccount,
            getAccount: getAccount,
            getUser: getUser,
            getOSMUserDetails: getOSMUserDetails,
            getUserProjects: getUserProjects
        };

        return service;

        /**
         * Sets the account details for a logged in user
         * @param username
         */
        function setAccount(username){
            if (username) {
                var resultsPromise = getUser(username);
                resultsPromise.then(function (data) {
                    // On success, set the account details for this user
                    account = data;
                });
            }
            else {
                account = {
                    username: '',
                    role: '',
                    mappingLevel: ''
                }
            }
        }

        /**
         * Returns the account details for a logged in user
         * @returns 
         */
        function getAccount() {
            return account;
        }

        /**
         * Get a user's details. This is not restricted to the currently logged in user.
         * @param username
         * @returns {*|!jQuery.deferred|!jQuery.Promise|!jQuery.jqXHR}
         */
        function getUser(username){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/user/' + username,
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'
                }
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return response.data;
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            })
        }

        /**
         * Get the user's OSM details
         * @param username
         * @returns {!jQuery.jqXHR|*|!jQuery.Promise|!jQuery.deferred}
         */
        function getOSMUserDetails(username){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/user/' + username + '/osm-details',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'
                }
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return response.data;
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            })
        }

        /**
         * Gets the projects the user has worked on
         * @param username
         * @returns {!jQuery.jqXHR|!jQuery.deferred|*|!jQuery.Promise}
         */
        function getUserProjects(username){
             // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/user/' + username + '/mapped-projects',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'
                }
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return response.data;
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            })
        }
    }
})();