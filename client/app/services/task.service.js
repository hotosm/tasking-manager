(function () {
    'use strict';
    /**
     * @fileoverview This file provides a service for task operations.
     */

    angular
        .module('taskingManager')
        .service('taskService', ['$http', '$q', 'configService', taskService]);

    function taskService($http, $q, configService) {

        var service = {
            getTask: getTask,
            getRandomMappableTaskFeature: getRandomMappableTaskFeature,
            getTasksByStatus: getTasksByStatus
        };

        return service;

        /**
         * Gets a task
         * @param projectId - id of project to to get task from
         * @param taskId - id of task to get
         * @returns {!jQuery.jqXHR|!jQuery.deferred|!jQuery.Promise|*}
         */
        function getTask(projectId, taskId) {
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/v1/project/' + projectId + '/task/' + taskId,
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'
                }
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return (response.data);
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            });
        }

        /**
         * returns a randomly selected mappable task feature from the passed in vector features.
         * Will return a non locked READY task if available,
         * otherwise will return a non locked INVALIDATED task if available,
         * otherwise will return null.
         * @param feature - array of ol.Feature objects from which to find a random task
         * @returns ol.Feature - randomly selected mappable ol.Feature object
         */
        function getRandomMappableTaskFeature(features) {
            //first check that we have a non empty array of ol.Feature objects
            if (features && (Object.prototype.toString.call(features) === '[object Array]') && features.length > 0) {

                var candidates = [];

                // get all non locked ready tasks
                var candidates = getTasksByStatus(features, false, 'READY');

                // if no ready tasks, get non locked invalidated tasks
                if (candidates.length == 0) {
                    candidates = getTasksByStatus(features, false, 'INVALIDATED');
                }

                // if candidates features were found, pick one randomly and return it
                if (candidates.length > 0) {
                    return candidates[Math.floor((Math.random() * (candidates.length - 1)))];
                }
            }

            // if all else fails, return null
            return null;
        }

        /**
         * Returns an array of task features that meet passed in locked and status criteria
         * @param features - array of ol.Feature objects
         * @param taskLocked - boolean, required locked status
         * @param taskStatus - required task status
         */
        function getTasksByStatus(features, taskLocked, taskStatus) {
            candidates = [];
            if (features && (Object.prototype.toString.call(features) === '[object Array]') && features.length > 0) {
                // get all non locked ready tasks
                var candidates = features.filter(function (item) {
                    if (typeof item.get === "function") {
                        // safe to use the function
                        var isLocked = item.get('taskLocked');
                        var status = item.get('taskStatus');
                        if (item.get('taskLocked') == taskLocked && item.get('taskStatus') === taskStatus) return item;
                    }
                });
            }
            return candidates;
        }
    }
})();
