(function () {
    'use strict';
    /**
     * @fileoverview This file provides a search service.
     */

    angular
        .module('taskingManager')
        .service('searchService', ['$http', '$q','configService', searchService]);

    function searchService($http, $q, configService) {
        
        var service = {
            searchProjects: searchProjects
        };

        return service;

        /**
         * Search projects
         * @param mapperLevel
         * @returns {*|!jQuery.deferred|!jQuery.Promise|!jQuery.jqXHR}
         */
        function searchProjects(mapperLevel){
            
            var searchParams = {};
            // default to beginner
            if (mapperLevel){
                searchParams.mapperLevel = mapperLevel;
            }
            
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/project/search',
                params: searchParams,
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