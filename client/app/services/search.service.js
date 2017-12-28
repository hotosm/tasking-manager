(function () {
    'use strict';
    /**
     * @fileoverview This file provides a search service.
     */

    angular
        .module('taskingManager')
        .service('searchService', ['$http', '$q','configService','languageService', 'authService', searchService]);

    function searchService($http, $q, configService, languageService, authService) {

        var service = {
            searchProjects: searchProjects,
            getProjectsWithinBBOX: getProjectsWithinBBOX
        };

        return service;

        /**
         * Search projects
         * @param searchParams
         * @returns {*|!jQuery.deferred|!jQuery.Promise|!jQuery.jqXHR}
         */
        function searchProjects(searchParams){

            var preferredLanguage = languageService.getLanguageCode();

            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/project/search',
                params: searchParams,
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Accept-Language': preferredLanguage
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
         * Get projects within BBOX
         * @param params
         * @returns {!jQuery.jqXHR|!jQuery.deferred|*|!jQuery.Promise}
         */
        function getProjectsWithinBBOX(params){

            params.srid = '4326';

            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/projects/within-bounding-box',
                params: params,
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
    }
})();
