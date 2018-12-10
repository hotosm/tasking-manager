(function () {
    'use strict';
    /**
     * @fileoverview This file provides a service for task operations.
     */

    angular
        .module('taskingManager')
        .service('taskService', ['$http', '$httpParamSerializer', '$q', 'configService', 'authService', taskService]);

    function taskService($http, $httpParamSerializer, $q, configService, authService) {

        var service = {
            getTask: getTask,
            unLockTaskMapping: unLockTaskMapping,
            stopMapping: stopMapping,
            lockTaskMapping: lockTaskMapping,
            addTaskComment: addTaskComment,
            unLockTaskValidation: unLockTaskValidation,
            stopValidating: stopValidating,
            lockTasksValidation: lockTasksValidation,
            getRandomMappableTaskFeature: getRandomMappableTaskFeature,
            getHighPriorityMappableTaskFeature: getHighPriorityMappableTaskFeature,
            getRandomTaskFeatureForValidation: getRandomTaskFeatureForValidation,
            getTasksByStatus: getTasksByStatus,
            getTaskFeatureById: getTaskFeatureById,
            getTaskFeaturesByIds: getTaskFeaturesByIds,
            getMappedTasksByUser: getMappedTasksByUser,
            getUserInvalidatedTasks: getUserInvalidatedTasks,
            getLockedTasksForCurrentUser: getLockedTasksForCurrentUser,
            getLockedTaskDetailsForCurrentUser: getLockedTaskDetailsForCurrentUser,
            splitTask: splitTask,
            getTaskFeaturesByIdAndStatus: getTaskFeaturesByIdAndStatus,
            undo: undo
        };

        return service;

        /**
         * Gets a task
         * @param projectId - id of project to to get task from
         * @param taskId - id of task to get
         * @returns {!jQuery.jqXHR|!jQuery.deferred|!jQuery.Promise|*}
         */
        function getTask(projectId, taskId) {

            // Optionally pass in an authenticated header (only when available)
            var headers = {'Content-Type': 'application/json; charset=UTF-8'};
            var authenticatedHeaders = authService.getAuthenticatedHeader();
            if (authenticatedHeaders){
                headers = authenticatedHeaders;
            }

            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/project/' + projectId + '/task/' + taskId,
                headers: headers
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
         * Requests a task unLock after mapping
         * @param projectId - id of the task project
         * @param taskId - id of the task
         * @param comment - comment for the unlock status change to be persisted to task history
         * @param status - new status.  If status not changing, use current status
         * @returns {!jQuery.jqXHR|!jQuery.Promise|*|!jQuery.deferred}
         */
        function unLockTaskMapping(projectId, taskId, comment, status) {
            // Returns a promise
            return $http({
                method: 'POST',
                data: {
                    comment: comment,
                    status: status
                },
                url: configService.tmAPI + '/project/' + projectId + '/task/' + taskId + '/unlock-after-mapping',
                headers: authService.getAuthenticatedHeader()
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return (response.data);
            }, function errorCallback(error) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject(error);
            });
        }

        /**
         * Requests stop mapping a task
         * @param projectId - id of the task project
         * @param taskId - id of the task
         * @param comment - comment for the unlock status change to be persisted to task history
         * @returns {!jQuery.jqXHR|!jQuery.Promise|*|!jQuery.deferred}
         */
        function stopMapping(projectId, taskId, comment) {
            // Returns a promise
            return $http({
                method: 'POST',
                data: {
                    comment: comment,
                },
                url: configService.tmAPI + '/project/' + projectId + '/task/' + taskId + '/stop-mapping',
                headers: authService.getAuthenticatedHeader()
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return (response.data);
            }, function errorCallback(error) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject(error);
            });
        }

        /**
         * Requests a task lock for mapping
         * @param projectId - id of the task project
         * @param taskId - id of the task
         * @returns {!jQuery.jqXHR|!jQuery.Promise|*|!jQuery.deferred}
         */
        function lockTaskMapping(projectId, taskId) {
            // Returns a promise
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/project/' + projectId + '/task/' + taskId + '/lock-for-mapping',
                headers: authService.getAuthenticatedHeader()
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return (response.data);
            }, function errorCallback(error) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject(error);
            });
        }

        /**
         * Adds a comment to a task outside of a locked session
         * @param projectId - id of the task project
         * @param taskId - id of the task
         * @param comment - the comment text
         * @returns {!jQuery.jqXHR|!jQuery.Promise|*|!jQuery.deferred}
         */
        function addTaskComment(projectId, taskId, comment) {
            // Returns a promise
            return $http({
                method: 'POST',
                data: {
                    comment: comment,
                },
                url: configService.tmAPI + '/project/' + projectId + '/task/' + taskId + '/comment',
                headers: authService.getAuthenticatedHeader()
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return (response.data);
            }, function errorCallback(error) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject(error);
            });
        }

        /**
         * Requests a task unlock after validation
         * @param projectId
         * @param tasks -json model for tasks to stop validation
         * @returns {*|!jQuery.Promise|!jQuery.deferred|!jQuery.jqXHR}
         */
        function unLockTaskValidation(projectId, tasks) {
            // Returns a promise
            return $http({
                method: 'POST',
                data: {
                    "validatedTasks": tasks
                },
                url: configService.tmAPI + '/project/' + projectId + '/unlock-after-validation',
                headers: authService.getAuthenticatedHeader()
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return (response.data.tasks);
            }, function errorCallback(error) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject(error);
            });
        }

        /**
         * Requests stop validating tasks
         * @param projectId
         * @param tasks - json model for tasks to stop validation
         * @returns {*|!jQuery.Promise|!jQuery.deferred|!jQuery.jqXHR}
         */
        function stopValidating(projectId, tasks) {
            // Returns a promise
            return $http({
                method: 'POST',
                data: {
                    "resetTasks": tasks
                },
                url: configService.tmAPI + '/project/' + projectId + '/stop-validating',
                headers: authService.getAuthenticatedHeader()
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return (response.data.tasks);
            }, function errorCallback(error) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject(error);
            });
        }

        /**
         * Requests a task lock for validation
         * @param projectId - id of the task project
         * @param taskIds - JSON object arrai of ids tasks to ne locked
         * @returns {!jQuery.jqXHR|!jQuery.Promise|*|!jQuery.deferred}
         */
        function lockTasksValidation(projectId, taskIds) {
            // Returns a promise
            return $http({
                method: 'POST',
                data: {
                    taskIds: taskIds
                },
                url: configService.tmAPI + '/project/' + projectId + '/lock-for-validation',
                headers: authService.getAuthenticatedHeader()
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return (response.data.tasks);
            }, function errorCallback(error) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject(error);
            });
        }

        /**
         * returns a randomly selected mappable task feature from the passed in vector features.
         * Will return a READY task if available,
         * otherwise will return an INVALIDATED task if available,
         * otherwise will return null.
         * @param features - array of ol.Feature objects from which to find a random task
         * @returns ol.Feature - randomly selected mappable ol.Feature object
         */
        function getRandomMappableTaskFeature(features) {
            //first check that we have a non empty array to work with
            if (features && (features instanceof Array) && features.length > 0) {

                var candidates = [];

                // get all non locked ready tasks
                var candidates = getTasksByStatus(features, 'READY');

                // if no ready tasks, get non locked invalidated tasks
                if (candidates.length == 0) {
                    candidates = getTasksByStatus(features, 'INVALIDATED');
                }

                // if candidates features were found, pick one randomly and return it
                if (candidates.length > 0) {
                    return candidates[Math.floor((Math.random() * (candidates.length - 1)))];
                }
            }

            // if all else fails, return null
            return null;
        }

        function getHighPriorityMappableTaskFeature(features) {
            //first check that we have a non empty array to work with
            if (features && (features instanceof Array) && features.length > 0) {

                var candidates = [];

                var candidates = getTasksByStatus(features, 'READY');

                // TODO Highest priority is to return invalidated tasks that were
                // done by the current mapper
                if (candidates.length > 0) {
                    var maxPriority = candidates.map(function(candidate) {
                        return candidate.getProperties().taskPriority;
                    }).reduce(function(priority, maxPriority) {
                        return priority > maxPriority ? priority : maxPriority
                    }, 0);
                    candidates = candidates.filter(function(candidate) {
                        return candidate.getProperties().taskPriority === maxPriority;
                    });
                    return candidates[Math.floor((Math.random() * (candidates.length - 1)))];
                }

            }
        }

        /**
         * returns a randomly selected validatable task feature from the passed in vector features.
         * Will return a MAPPED task if available,
         * otherwise will return null.
         * @param features - array of ol.Feature objects from which to find a random task
         * @returns ol.Feature - randomly selected mappable ol.Feature object
         */
        function getRandomTaskFeatureForValidation(features) {
            //first check that we have a non empty array to work with
            if (features && (features instanceof Array) && features.length > 0) {

                var candidates = [];

                // get all MAPPED tasks
                var candidates = getTasksByStatus(features, 'MAPPED');

                // if candidates features were found, pick one randomly and return it
                if (candidates.length > 0) {
                    return candidates[Math.floor((Math.random() * (candidates.length - 1)))];
                }
            }

            // if all else fails, return null
            return null;
        }

        /**
         * Returns an array of task features that meet passed in status criteria
         * @param features - array of ol.Feature objects
         * @param status - required task status
         */
        function getTasksByStatus(features, status) {
            candidates = [];
            //first check we are working with a non empty array
            if (features && (features instanceof Array) && features.length > 0) {
                // get all tasks with taskStatus property meeting the passed in values for status
                var candidates = features.filter(function (item) {
                    //check we are working with an ol.Feature
                    if (item instanceof ol.Feature) {
                        // safe to use the function
                        var taskStatus = item.get('taskStatus');
                        if (taskStatus === status)
                            return item;
                    }
                });
            }
            return candidates;
        }

        /**
         * Get a task feature by task ID
         * @param features
         * @param id
         * @returns {ol.Feature} task feature
         */
        function getTaskFeatureById(features, id) {
            candidates = [];
            //first check we are working with a non empty array
            if (features && (features instanceof Array) && features.length > 0) {
                // get all tasks with taskId= id
                var candidates = features.filter(function (item) {
                    //check we are working with an ol.Feature
                    if (item instanceof ol.Feature) {
                        // safe to use the function
                        var taskId = item.get('taskId');
                        if (taskId == id)
                            return item;
                    }
                });
            }
            if (candidates.length > 0) {
                return candidates[0];
            }
            return null;
        }

        /**
         *
         * @param features {Array<ol.Feature>}
         * @param ids {Array}
         * @returns {Array<ol.Feature>}
         */
        function getTaskFeaturesByIds(features, ids) {
            candidates = [];
            //first check we are working with a non empty array
            if (features && (features instanceof Array) && features.length > 0) {
                // get all tasks with taskId= id
                var candidates = features.filter(function (item) {
                    //check we are working with an ol.Feature
                    if (item instanceof ol.Feature) {
                        // safe to use the function
                        var taskId = item.get('taskId');
                        var i = ids.indexOf(taskId);

                        if (i !== -1)
                            return ids[i];
                    }
                });
            }
            if (candidates.length > 0) {
                return candidates;
            }
            return null;
        }

        /**
         * Filters features by id and status
         * @param features {Array<ol.Feature>} Features to be filtered
         * @param ids {Array} task ids to filter on
         * @param status to filter on
         * @returns {Array<ol.Feature>}
         */
        function getTaskFeaturesByIdAndStatus(features, ids, status) {

            candidates = [];
            //first check we are working with a non empty array
            if (features && (features instanceof Array) && features.length > 0) {
                // get all tasks with taskId= id
                var candidates = features.filter(function (item) {
                    //check we are working with an ol.Feature
                    if (item instanceof ol.Feature) {
                        // safe to use the function
                        var taskId = item.get('taskId');
                        var taskStatus = item.get('taskStatus');
                        var i = ids.indexOf(taskId);
                        if (i !== -1 && taskStatus === status) {
                            return item;
                        }
                    }
                });
            }
            return candidates;

        }

        /**
         * Gets mapped tasks grouped by user and returns a promise
         * @param projectId
         * @returns {!jQuery.jqXHR|*|!jQuery.Promise|!jQuery.deferred}
         */
        function getMappedTasksByUser(projectId) {
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/project/' + projectId + '/mapped-tasks-by-user',
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
         * Gets invalidated tasks either mapped or invalidated by user (depending
         * on asValidator parameter), and returns promise
         * @param projectId
         * @returns {!jQuery.jqXHR|*|!jQuery.Promise|!jQuery.deferred}
         */
        function getUserInvalidatedTasks(asValidator, username, page, pageSize,
                                         sortBy, sortDirection, closedFilter, projectFilter) {
            var params = $httpParamSerializer({
              asValidator: asValidator,
              page: page,
              pageSize: pageSize,
              closed: closedFilter,
              project: projectFilter,
              sortBy: sortBy,
              sortDirection: sortDirection,
            });

            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/user/' + username + '/invalidated-tasks' +
                     (params.length > 0 ? '?' + params : ''),
                headers: authService.getAuthenticatedHeader()
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
         * Gets ids of tasks which are locked by the current user
         * @param projectId
         * @returns {*|!jQuery.deferred|!jQuery.jqXHR|!jQuery.Promise}
         */
        function getLockedTasksForCurrentUser(projectId) {
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/project/' + projectId + '/has-user-locked-tasks',
                headers: authService.getAuthenticatedHeader()
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return (response.data.lockedTasks);
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            });
        }

       /**
         * Gets details of tasks which are locked by the current user
         * @param projectId
         * @returns {*|!jQuery.deferred|!jQuery.jqXHR|!jQuery.Promise}
         */
        function getLockedTaskDetailsForCurrentUser(projectId) {
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/project/' + projectId + '/has-user-locked-tasks/details',
                headers: authService.getAuthenticatedHeader()
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return (response.data.tasks);
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            });
        }

        /**
         * Requests a task split
         * @param projectId - id of the task project
         * @param taskId - id of the task
         * @returns {!jQuery.jqXHR|!jQuery.Promise|*|!jQuery.deferred}
         */
        function splitTask(projectId, taskId) {
            // Returns a promise
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/project/' + projectId + '/task/' + taskId + '/split',
                headers: authService.getAuthenticatedHeader()
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return (response.data);
            }, function errorCallback(error) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject(error);
            });
        }

        /**
         * Undo marking a task. It returns it to its previous state.
         * @param projectId
         * @param taskId
         * @returns {!jQuery.jqXHR|*|!jQuery.deferred|!jQuery.Promise}
         */
        function undo(projectId, taskId){
            // Returns a promise
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/project/' + projectId + '/task/' + taskId + '/undo-mapping',
                headers: authService.getAuthenticatedHeader()
            }).then(function successCallback(response){
                // this callback will be called asynchronously
                // when the response is available
                return (response.data);
            }, function errorCallback(error) {
                 // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject(error);
            });
        }
    }
})();
