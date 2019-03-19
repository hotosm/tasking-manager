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
            formatShortCodes: formatShortCodes,
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
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject(response);
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
         * @param projectId
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
            var usernames = text && text.match(regex);
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

        /**
         * Format OSM viewport URLs or zoom/lat/lon references as openstreetmap.org
         * links that open in a new tab. Supported viewport references:
         *
         * [v/14/42.3824/12.2633]        -> https://www.openstreetmap.org/#map=14/42.3824/12.2633
         * [view/14/42.3824/12.2633]     -> https://www.openstreetmap.org/#map=14/42.3824/12.2633
         * [viewport/14/42.3824/12.2633] -> https://www.openstreetmap.org/#map=14/42.3824/12.2633
         *
         * Note: for convenience, a full url can also be given instead of just zoom/lat/lon.
         * E.G., [v/https://www.openstreetmap.org/#map=14/42.3824/12.2633]
         *
         * @param text
         */
        function formatViewportShortcodeToLink(text){
            if (text) {
              var shortCodeRegex = /\[(v|view|viewport)\/(https:\/\/www.openstreetmap.org\/#map=)?([^/]+\/[^/]+\/[^/]+)\]/g;
              var codeMap = {
                v: 'viewport',
                view: 'viewport',
                viewport: 'viewport',
              };
              var shortCodeMatch = null;

              while (shortCodeMatch = shortCodeRegex.exec(text)) {
                  // Ignore short codes we don't explicitly support
                  if (!codeMap[shortCodeMatch[1]]) {
                      continue;
                  }

                  // zoom/lat/lon
                  var viewport = shortCodeMatch[3];
                  var linkUrl = 'https://www.openstreetmap.org/#map=' + viewport;
                  var linkTitle = codeMap[shortCodeMatch[1]] + ' ' + viewport;
                  var linkText = codeMap[shortCodeMatch[1]] + '/' + viewport;
                  var link = '<a target="_blank" title="' + linkTitle + '" href="' + linkUrl + '">' + linkText + '</a>';

                  // Replace short-code in text with generated link
                  text = text.replace(shortCodeMatch[0], link);
              }
            }

            return text;
        }

        /**
         * Format OSM entity references as openstreetmap.org links that open
         * in a new tab. Supported entity references:
         * [n/123]        -> https://www.openstreetmap.org/node/123
         * [node/123]     -> https://www.openstreetmap.org/node/123
         * [w/123]        -> https://www.openstreetmap.org/way/123
         * [way/123]      -> https://www.openstreetmap.org/way/123
         * [r/123]        -> https://www.openstreetmap.org/relation/123
         * [rel/123]      -> https://www.openstreetmap.org/relation/123
         * [relation/123] -> https://www.openstreetmap.org/relation/123
         * @param text
         */
        function formatOsmEntitiesToLink(text){
            if (text) {
              var shortCodeRegex = /\[\w+\/\d+(,?\s*\w+\/\d+)*\]/g;
              var entityRegex = /(\w+)\/(\d+)/;
              var entityMap = {
                n: 'node',
                node: 'node',
                w: 'way',
                way: 'way',
                r: 'relation',
                rel: 'relation',
                relation: 'relation'
              };

              var shortCodeMatch = null;
              while (shortCodeMatch = shortCodeRegex.exec(text)) {
                // There could be multiple entities in a combo code, so split them up
                // and expand each one. Entities must be comma or space separated.
                var entities = shortCodeMatch[0].slice(1, -1).split(/,\s*|\s+/);

                var expandedEntities = entities.map(function(entity) {
                    var entityMatch = entityRegex.exec(entity);
                    // Ignore short codes we don't explicitly support
                    if (!entityMap[entityMatch[1]]) {
                        return null;
                    }

                    return {
                        linkText: entityMap[entityMatch[1]] + '/' + entityMatch[2],
                        linkTitle: entityMap[entityMatch[1]] + ' ' + entityMatch[2],
                        overpassQuery: entityMap[entityMatch[1]] + '(' + entityMatch[2] + ');'
                    };
                });

                // If there are any null entity expansions, we have an unsupported code, so ignore it.
                if (expandedEntities.indexOf(null) !== -1) {
                    continue;
                }

                // Combine expansion data from all entities into final link
                var linkText = expandedEntities.map(function(e) { return e.linkText; }).join(', ');
                var linkTitle = expandedEntities.map(function(e) { return e.linkTitle; }).join(', ');
                var overpassQuery =
                    '(' +
                    expandedEntities.map(function(e) { return e.overpassQuery; }).join('') +
                    ');(._;>;);out;';
                var linkUrl='http://overpass-turbo.eu/map.html?Q=' + encodeURIComponent(overpassQuery);
                var link = '<a target="_blank" title="' + linkTitle + '" href="' + linkUrl + '">' + linkText + '</a>';

                // Replace short code in comment with generated link
                text = text.replace(shortCodeMatch[0], link);
              }
            }

            return text;
        }

        /**
         * Formats short codes in the text, such as usernames and OSM entity
         * links.
         * @param text
         */
        function formatShortCodes(text) {
          return formatViewportShortcodeToLink(
              formatOsmEntitiesToLink(
                  formatUserNamesToLink(text)
              )
          );
        }
    }
})();
