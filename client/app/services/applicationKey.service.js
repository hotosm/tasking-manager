(function () {
    'use strict';
    /**
     * @fileoverview This file provides an application key service.
     */

    angular
        .module('taskingManager')
        .service('applicationKeyService', ['$http', '$q','configService', 'authService', applicationKeyService]);

    function applicationKeyService($http, $q, configService, authService) {

        var service = {
            createApplicationKey: createApplicationKey,
            getApplicationKeys: getApplicationKeys,
            deleteApplicationKey: deleteApplicationKey
        };

        return service;

        /**
        * Create an application key
        * @returns {!jQuery.Promise|!jQuery.jqXHR|*|!jQuery.deferred}
        */
        function createApplicationKey(){
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/application',
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
        * Get user application keys
        * @returns {!jQuery.Promise|!jQuery.jqXHR|*|!jQuery.deferred}
        */
        function getApplicationKeys(){
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/application',
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
        * Delete an application key
        * @param applicationKey
        * @returns {!jQuery.Promise|!jQuery.jqXHR|*|!jQuery.deferred}
        */
        function deleteApplicationKey(applicationKey){
            return $http({
                method: 'DELETE',
                url: configService.tmAPI + '/application/' + applicationKey,
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
