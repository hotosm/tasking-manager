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
            getTask: getTask
        };

        return service;

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


            // var exampleTask = {
            //     "projectId": 1,
            //     "taskHistory": [
            //         {
            //             "action": "LOCKED",
            //             "actionDate": "2017-03-13T12:44:00.644487",
            //             "actionText": null
            //         },
            //         {
            //             "action": "STATE_CHANGE",
            //             "actionDate": "2017-03-13T12:31:23.734633",
            //             "actionText": "DONE"
            //         },
            //         {
            //             "action": "LOCKED",
            //             "actionDate": "2017-03-13T12:31:23.734633",
            //             "actionText": "00:02:52.047045"
            //         },
            //         {
            //             "action": "COMMENT",
            //             "actionDate": "2017-03-13T12:31:23.734633",
            //             "actionText": "Mapping makes me feel good!"
            //         },
            //         {
            //             "action": "LOCKED",
            //             "actionDate": "2017-03-13T12:00:46.921751",
            //             "actionText": "00:31:19.262462"
            //         }
            //     ],
            //     "taskId": 1,
            //     "taskLocked": false,
            //     "taskStatus": "DONE"
            // }
            //
            // return exampleTask;
        }

    }
})();
