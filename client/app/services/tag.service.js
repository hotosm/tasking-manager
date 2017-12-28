(function () {
    'use strict';
    /**
     * @fileoverview This file provides a tag service.
     */

    angular
        .module('taskingManager')
        .service('tagService', ['$http', '$q','configService', tagService]);

    function tagService($http, $q, configService) {

        var service = {
            getOrganisationTags: getOrganisationTags,
            getCampaignTags: getCampaignTags
        };

        return service;

        /**
         * Get the organisation tags
         * @returns {*|!jQuery.Promise|!jQuery.deferred|!jQuery.jqXHR}
         */
        function getOrganisationTags(){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/tags/organisations'
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
         * Get the campaign tags
         * @returns {*|!jQuery.Promise|!jQuery.deferred|!jQuery.jqXHR}
         */
        function getCampaignTags(){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/tags/campaigns'
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
