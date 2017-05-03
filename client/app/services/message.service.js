(function () {
    'use strict';
    /**
     * @fileoverview This file provides a message service.
     */

    angular
        .module('taskingManager')
        .service('messageService', ['$http', '$q','configService', 'authService', messageService]);

    function messageService($http, $q, configService, authService) {
        
        var service = {
            messageAll: messageAll
        };

        return service;

        /**
         * Message all users
         * @returns {*|!jQuery.Promise|!jQuery.deferred|!jQuery.jqXHR}
         */
        function messageAll(projectId, subject, message){
            // Returns a promise
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/admin/project/' + projectId + '/message-all',
                data: {
                    message: message,
                    subject: subject
                },
                headers: authService.getAuthenticatedHeader()
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