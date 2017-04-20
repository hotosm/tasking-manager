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
            getProjectContributions: getProjectContributions
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
    }
})();