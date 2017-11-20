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
            setLevel: setLevel,
            getOSMUserDetails: getOSMUserDetails,
            getUserProjects: getUserProjects,
            searchUser: searchUser,
            searchAllUsers: searchAllUsers,
            acceptLicense: acceptLicense,
            setContactDetails: setContactDetails
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
         * Set the user's level
         * @param username
         * @param level
         * @returns {*|!jQuery.deferred|!jQuery.jqXHR|!jQuery.Promise}
         */
        function setLevel(username, level){
            // Returns a promise
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/user/' + username + '/set-level/' + level,
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

        /**
         * Search a user
         * @returns {!jQuery.jqXHR|*|!jQuery.deferred|!jQuery.Promise}
         */
        function searchUser(username){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/user/search/filter/' + username,
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
         * Searches all users
         * @param page
         * @param role
         * @param level
         * @param username
         * @returns {*|!jQuery.Promise|!jQuery.jqXHR|!jQuery.deferred}
         */
        function searchAllUsers(page, role, level, username){
            var searchParams = '';
            if (page){
                searchParams += 'page=' + page;
            }
            else {
                searchParams += 'page=1';
            }
            if (role){
                searchParams += '&role=' + role;
            }
            if (level){
                searchParams += '&level=' + level;
            }
            if (username){
                searchParams += '&username=' + username;
            }

            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/user/search-all?' + searchParams,
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
         * Accept license
         * @param id
         * @returns {!jQuery.jqXHR|*|!jQuery.Promise|!jQuery.deferred}
         */
        function acceptLicense(id){
            // Returns a promise
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/user/accept-license/' + id,
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
         * Set contact details
         * @param contactDetails
         * @returns {!jQuery.Promise|*|!jQuery.jqXHR|!jQuery.deferred}
         */
        function setContactDetails(contactDetails){
            // Returns a promise
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/user/update-details',
                data: contactDetails,
                headers: authService.getAuthenticatedHeader()
            }).then(function successCallback(response){
                // this callback will be called asynchronously
                // when the response is available
                return response.data;
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status
                return $q.reject("error");
            })
        }
    }
})();
