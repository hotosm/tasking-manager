(function () {
    'use strict';
    /**
     * @fileoverview This file provides a service for task operations.
     */

    angular
        .module('taskingManager')
        .service('taskService', [taskService]);

    function taskService() {

        var service = {
            getTask: getTask
        };

        return service;

        function getTask(projectId, taskId) {
            var exampleTask = {
                "projectId": 1,
                "taskHistory": [
                    {
                        "action": "LOCKED",
                        "actionDate": "2017-03-13T12:44:00.644487",
                        "actionText": null
                    },
                    {
                        "action": "STATE_CHANGE",
                        "actionDate": "2017-03-13T12:31:23.734633",
                        "actionText": "DONE"
                    },
                    {
                        "action": "LOCKED",
                        "actionDate": "2017-03-13T12:31:23.734633",
                        "actionText": "00:02:52.047045"
                    },
                    {
                        "action": "COMMENT",
                        "actionDate": "2017-03-13T12:31:23.734633",
                        "actionText": "Mapping makes me feel good!"
                    },
                    {
                        "action": "LOCKED",
                        "actionDate": "2017-03-13T12:00:46.921751",
                        "actionText": "00:31:19.262462"
                    }
                ],
                "taskId": 1,
                "taskLocked": false,
                "taskStatus": "DONE"
            }

            return exampleTask;
        }

    }
})();
