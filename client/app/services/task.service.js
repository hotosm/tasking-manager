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
            getTasksByStatus: getTasksByStatus,
            lockTask: lockTask
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

        function lockTask(projectId, taskId){
            // Returns a promise
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/v1/project/'+projectId+'/task/'+taskId+'/lock',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'
                }
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return (response);
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
            //first check that we have a non empty array to work with
            if (features && (features instanceof Array) && features.length > 0) {

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
        function getTasksByStatus(features, locked, status) {
            //TODO - may need to refactor to allow passing in null for locked or status to infer any value.
            //This would allow get all locked tasks, regardless of status, or all tasks with certain status,
            //regardless of locked
            candidates = [];
            //first check we are working with a non empty array
            if (features && (features instanceof Array) && features.length > 0) {
                // get all tasks with taskLocked and taskStatus property values meeting the passed in values for locked and status
                var candidates = features.filter(function (item) {
                    //check we are working with an ol.Feature
                    if (item instanceof ol.Feature) {
                        // safe to use the function
                        var taskLocked = item.get('taskLocked');
                        var taskStatus = item.get('taskStatus');
                        if (taskLocked == locked && taskStatus === status)
                            return item;
                    }
                });
            }
            return candidates;
        }
    }
})();
