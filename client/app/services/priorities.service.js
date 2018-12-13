(function () {
    'use strict';
    /**
     * @fileoverview This file provides a priority service
     */

    angular
        .module('taskingManager')
        .service('priorityService', ['$http', '$q', 'configService', 'authService', priorityService]);

    function priorityService($http, $q, configService, authService) {

        var service = {
            getPriority: getPriority,
            getPriorityList: getPriorityList,
            deletePriority: deletePriority,
        };

        return service;

        /**
         * Get the priority for the ID
         * @param id - priority id
         * @returns {*}
         */
        function getPriority(id) {
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/priority/' + id,
                headers: authService.getAuthenticatedHeader()
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return response.data;
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            });
        }

        /**
         * Delete the priority for the ID
         * @param id - priority id
         * @returns {*}
         */
        function deletePriority(id) {
            // Returns a promise
            return $http({
                method: 'DELETE',
                url: configService.tmAPI + '/priority/' + id,
                headers: authService.getAuthenticatedHeader()
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return response.data;
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            });
        }

        /**
         * Get all priorities
         * @returns {*|!jQuery.Promise|!jQuery.deferred|!jQuery.jqXHR}
         */
        function getPriorityList(projectId){
            // Returns a promise
            var url = configService.tmAPI + '/priority/list';
            if (projectId) {
                url += '?project_id=' + projectId;
            }
            return $http({
                method: 'GET',
                url: url,
                headers: authService.getAuthenticatedHeader()
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return response.data;
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            });
        }
    }
})();
