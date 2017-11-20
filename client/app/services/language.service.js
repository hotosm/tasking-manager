(function () {
    'use strict';
    /**
     * @fileoverview This file provides a language service.
     */

    angular
        .module('taskingManager')
        .service('languageService', [languageService]);

    function languageService() {

        var languageCode = 'en'; // default to English

        var service = {
            setLanguageCode: setLanguageCode,
            getLanguageCode: getLanguageCode
        };

        return service;

        /**
         * Set language code
         * @param code
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
    }
})();
