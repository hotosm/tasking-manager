(function () {
    'use strict';
    /**
     * @fileoverview This file provides a user service.
     */

    angular
        .module('taskingManager')
        .service('userService', ['$http', '$q','configService','authService', userService]);

    function userService($http, $q, configService, authService) {

        var service = {
            setRole: setRole,
            getOSMUserDetails: getOSMUserDetails
        };

        return service;

        /**
         * Set the user's role
         * @param username
         * @param role
         * @returns {*|!jQuery.jqXHR|!jQuery.Promise|!jQuery.deferred}
         */
        function setRole(username, role){
            // Returns a promise
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/user/' + username + '/set-role/' + role,
                headers: authService.getAuthenticatedHeader()
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
    }
})();