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
            messageAll: messageAll,
            hasNewMessages: hasNewMessages,
            getAllMessages: getAllMessages,
            getMessage: getMessage,
            deleteMessage: deleteMessage
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

        /**
         * Check if a user has new messages
         * @returns {!jQuery.jqXHR|!jQuery.Promise|!jQuery.deferred|*}
         */
        function hasNewMessages(){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/messages/has-new-messages',
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

        /**
         * Get all messages
         * @returns {*|!jQuery.jqXHR|!jQuery.deferred|!jQuery.Promise}
         */
        function getAllMessages(){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/messages/get-all-messages',
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

        /**
         * Get a message
         * @param messageId
         * @returns {*|!jQuery.jqXHR|!jQuery.deferred|!jQuery.Promise}
         */
        function getMessage(messageId){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/messages/' + messageId,
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

        /**
         * Deletes a message
         * @param messageId
         * @returns {*|!jQuery.deferred|!jQuery.Promise|!jQuery.jqXHR}
         */
        function deleteMessage(messageId){
            // Returns a promise
            return $http({
                method: 'DELETE',
                url: configService.tmAPI + '/messages/' + messageId,
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