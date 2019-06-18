(function () {
    'use strict';
    /**
     * @fileoverview This file provides a campaign service.
     */

    angular
        .module('taskingManager')
        .service('campaignService', ['$http', '$q','configService', campaignService]);

    function campaignService($http, $q, configService) {

        var service = {
            getCampaigns: getCampaigns,
            getProjectCampaigns: getProjectCampaigns,
            setCampaignForProject: setCampaignForProject,
            deleteProjectCampaign: deleteProjectCampaign,
        };

        return service;

        /**
         * Get all the campaigns
         * @returns {*|!jQuery.Promise|!jQuery.deferred|!jQuery.jqXHR}
         */
        function getCampaigns(){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/campaigns'
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
         * Get all the campaigns
         * @returns {*|!jQuery.Promise|!jQuery.deferred|!jQuery.jqXHR}
         */
        function getProjectCampaigns(project_id){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/project/campaigns/' + project_id,
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
         * Set campaign to the project
         * @returns {*|!jQuery.Promise|!jQuery.deferred|!jQuery.jqXHR}
         */
        function setCampaignForProject(campaign_id, project_id){
            // Returns a promise
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/project/campaign',
                data:{
                    campaign_id: campaign_id,
                    project_id: project_id
                }
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
         * Deletes a project
         * @param id
         * @returns {*|!jQuery.Promise|!jQuery.deferred|!jQuery.jqXHR}
         */
        function deleteProjectCampaign(project_id, campaign_id) {
            // Returns a promise
            return $http({
                method: 'DELETE',
                url: configService.tmAPI + '/project/campaign?project_id='+project_id+'&campaign_id='+campaign_id,
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