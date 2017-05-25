(function () {
    'use strict';
    /**
     * @fileoverview This file provides a language service.
     */

    angular
        .module('taskingManager')
        .service('languageService', ['$http', '$q', 'configService', languageService]);

    function languageService($http, $q, configService) {
        
        var languageCode = 'en'; // default to English
        
        var service = {
            setLanguageCode: setLanguageCode,
            getLanguageCode: getLanguageCode,
            getAvailableLanguages: getAvailableLanguages
        };

        return service;

        /**
         * Set language code
         * @param languageCode
         */
        function setLanguageCode(code){
            languageCode = code;
        }

        /**
         * Get language code
         * @returns {string}
         */
        function getLanguageCode(){
            return languageCode;
        }

        /**
         * Get available languages
         * @returns {*|!jQuery.deferred|!jQuery.Promise|!jQuery.jqXHR}
         */
        function getAvailableLanguages(){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/settings/languages',
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