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
            getProjectChatMessages: getProjectChatMessages,
            addProjectChatMessage: addProjectChatMessage,
            deleteMessage: deleteMessage,
            resendEmailVerification: resendEmailVerification,
            formatUserNamesToLink: formatUserNamesToLink
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
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject(response);
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

        /**
         * Resend the email address verification email
         * @returns {!jQuery.deferred|*|!jQuery.Promise|!jQuery.jqXHR}
         */
        function resendEmailVerification(){
             // Returns a promise
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/messages/resend-email-verification',
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
         * Get chat messages
         * @param projectId
         * @returns {*|!jQuery.Promise|!jQuery.jqXHR|!jQuery.deferred}
         */
        function getProjectChatMessages(projectId){
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/project/' + projectId + '/chat'
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return response.data;
            }, function errorCallback(error) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject(error);
            });
        }

        /**
         * Add project chat message
         * @param message
         * @returns {*|!jQuery.Promise|!jQuery.jqXHR|!jQuery.deferred}
         */
        function addProjectChatMessage(message, projectId){
            // Returns a promise
            return $http({
                method: 'PUT',
                url: configService.tmAPI + '/project/' + projectId + '/chat',
                data: {
                    message: message
                },
                headers: authService.getAuthenticatedHeader()
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return response.data;
            }, function errorCallback(error) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject(error);
            });
        }

        /**
         * Format user names to link to user profile
         * @param text
         */
        function formatUserNamesToLink(text){
            var regex = /@\[([^\]]+)\]/gi;
            // Find usernames with a regular expression. They all start with '[@' and end with ']'
            var usernames = text.match(regex);
            if (usernames) {
                for (var i = 0; i < usernames.length; i++) {
                    // Strip off the first two characters: '@['
                    var username = usernames[i].substring(2, usernames[i].length);
                    // Strip off the last character
                    username = username.substring(0, username.length - 1);
                    text = text.replace(usernames[i], '<a href="/user/' + username + '">' + username + '</a>');
                }
            }
            return text;
        }
    }
})();