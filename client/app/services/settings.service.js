(function () {
    'use strict';
    /**
     * @fileoverview This file provides a settings service.
     */

    angular
        .module('taskingManager')
        .service('settingsService', ['$http', '$q', 'configService', settingsService]);

    function settingsService($http, $q, configService) {
        
        var service = {
            getSettings: getSettings
        };

        return service;

        /**
         * Get the app settins
         * @returns {*|!jQuery.deferred|!jQuery.Promise|!jQuery.jqXHR}
         */
        function getSettings(){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/settings',
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