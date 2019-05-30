(function () {
    'use strict';
    /**
     * @fileoverview This file provides a stats service.
     */

    angular
        .module('taskingManager')
        .service('statsService', ['$http', '$q','configService', statsService]);

    function statsService($http, $q, configService) {

        var service = {
            getProjectContributions: getProjectContributions,
            getProjectActivity: getProjectActivity,
            getProjectStats: getProjectStats,
            getHomePageStats: getHomePageStats
        };

        return service;

          /**
         * Get project contributions
         * @param projectId
         * @returns {!jQuery.Promise|!jQuery.jqXHR|*|!jQuery.deferred}
         */
        function getProjectContributions(projectId){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/stats/project/' + projectId + '/contributions'
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
         * Get the project activity
         * @param projectId
         * @param page - optional
         * @returns {!jQuery.deferred|!jQuery.jqXHR|*|!jQuery.Promise}
         */
        function getProjectActivity(projectId, page){
            var pageToGet = '';
            if (page) {
                pageToGet = '?page=' + page;
            }

            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/stats/project/' + projectId + '/activity' + pageToGet
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
         * Get project stats
         * @param projectId
         * @returns {*|!jQuery.deferred|!jQuery.Promise|!jQuery.jqXHR}
         */
        function getProjectStats(projectId){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/stats/project/' + projectId
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
         * Get homepage stats
         * @returns {*|!jQuery.deferred|!jQuery.Promise|!jQuery.jqXHR}
         */
        function getHomePageStats(){
            console.log('In service');
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/stats/summary'
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
