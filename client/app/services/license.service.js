(function () {
    'use strict';
    /**
     * @fileoverview This file provides a license service
     */

    angular
        .module('taskingManager')
        .service('licenseService', ['$http', '$q', 'configService', 'authService', licenseService]);

    function licenseService($http, $q, configService, authService) {

        var service = {
            getLicense: getLicense,
            createLicense: createLicense,
            deleteLicense: deleteLicense,
            updateLicense: updateLicense,
            getLicenseList: getLicenseList
        };

        return service;

        /**
         * Get the license for the ID
         * @param id - license id
         * @returns {*}
         */
        function getLicense(id) {
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/license/' + id,
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
         * Create a new license
         * @param licenseData
         * @returns {*|!jQuery.deferred|!jQuery.jqXHR|!jQuery.Promise}
         */
        function createLicense(licenseData){
            // Returns a promise
            return $http({
                method: 'PUT',
                url: configService.tmAPI + '/license',
                data: licenseData,
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
         * Delete a license
         * @param id
         * @returns {*|!jQuery.deferred|!jQuery.jqXHR|!jQuery.Promise}
         */
        function deleteLicense(id){
            // Returns a promise
            return $http({
                method: 'DELETE',
                url: configService.tmAPI + '/license/' + id,
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

        function updateLicense(licenseData, id){
            // Returns a promise
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/license/' + id,
                data: licenseData,
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
         * Get all licenses
         * @returns {*|!jQuery.Promise|!jQuery.deferred|!jQuery.jqXHR}
         */
        function getLicenseList(){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/license/list',
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
