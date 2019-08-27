(function () {
    'use strict';
    /**
     * @fileoverview This file provides a service for task-mapping issues.
     */

    angular
        .module('taskingManager')
        .service('mappingIssueService', ['$http', '$q','configService', 'authService', mappingIssueService]);

    function mappingIssueService($http, $q, configService, authService) {

        var service = {
            getMappingIssueCategory: getMappingIssueCategory,
            createMappingIssueCategory: createMappingIssueCategory,
            deleteMappingIssueCategory: deleteMappingIssueCategory,
            updateMappingIssueCategory: updateMappingIssueCategory,
            getMappingIssueCategories: getMappingIssueCategories,
        };

        return service;

        /**
         * Get the mapping-issue category for the ID
         * @param id - mapping-issue category id
         * @returns {*}
         */
        function getMappingIssueCategory(id) {
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/mapping-issue-category/' + id,
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
         * Create a new mapping-issue category
         * @param categoryData
         * @returns {*|!jQuery.deferred|!jQuery.jqXHR|!jQuery.Promise}
         */
        function createMappingIssueCategory(categoryData){
            // Returns a promise
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/mapping-issue-category',
                data: categoryData,
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
         * Delete a mapping-issue category
         * @param id
         * @returns {*|!jQuery.deferred|!jQuery.jqXHR|!jQuery.Promise}
         */
        function deleteMappingIssueCategory(id){
            // Returns a promise
            return $http({
                method: 'DELETE',
                url: configService.tmAPI + '/mapping-issue-category/' + id,
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

        function updateMappingIssueCategory(categoryData, id){
            // Returns a promise
            return $http({
                method: 'PUT',
                url: configService.tmAPI + '/mapping-issue-category/' + id,
                data: categoryData,
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
         * Get all existing mapping-issue categories
         * @returns {*|!jQuery.Promise|!jQuery.deferred|!jQuery.jqXHR}
         */
        function getMappingIssueCategories(includeArchived){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/mapping-issue-categories' +
                     (includeArchived ? '?includeArchived=true' : ''),
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
