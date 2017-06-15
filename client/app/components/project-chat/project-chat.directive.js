(function () {

    'use strict';

    /**
     * @fileoverview This file provides a project chat directive.
     */

    angular
        .module('taskingManager')
        .controller('projectChatController', ['$scope', '$anchorScroll', '$location', '$timeout', '$interval', 'messageService', 'userService', projectChatController])
        .directive('projectChat', projectChatDirective);

    /**
     * Creates project-chat directive
     * Example:
     *
     *  <project-chat project-id="projectCtrl.id" project-author="projectCtrl.projectData.author"></project-chat>
     */
    function projectChatDirective() {

        var directive = {
            restrict: 'EA',
            templateUrl: 'app/components/project-chat/project-chat.html',
            controller: 'projectChatController',
            controllerAs: 'projectChatCtrl',
            scope: {
                projectId: '=projectId',
                projectAuthor: '=projectAuthor'
            },
            bindToController: true // because the scope is isolated
        };

        return directive;
    }

    function projectChatController($scope, $anchorScroll, $location, $timeout, $interval, messageService, userService) {

        var vm = this;
        vm.projectId = 0;
        vm.author = '';
        vm.message = '';
        vm.messages = [];
        vm.maxlengthComment = 250;

        vm.hasScrolled = false;
        
        // Errors
        vm.successMessageAdded = false;
        vm.errorMessageAdded = false;
        vm.errorGetMessages = false;
        vm.errorAddPMUsername = false;

        //interval timer promise for autorefresh
        var autoRefresh = undefined;
        
         /**
         * Watches the selected feature
         */
        $scope.$watch('projectChatCtrl.projectId', function(id) {
            vm.projectId = id;
            if (vm.projectId){
                getChatMessages();
            }
        });
        $scope.$watch('projectChatCtrl.projectAuthor', function(authorName) {
            vm.author = authorName;
        });

        //start up a timer for getting the chat messages
        autoRefresh = $interval(function () {
            getChatMessages();
        }, 10000);

           // listen for navigation away from the page event and stop the autrefresh timer
        $scope.$on('$locationChangeStart', function (event, newUrl, oldUrl) {
            if (oldUrl.indexOf($location.path()) == -1) { //check that we are navigating away from the page
                if (angular.isDefined(autoRefresh)) {
                    $interval.cancel(autoRefresh);
                    autoRefresh = undefined;
                }
            }
        });

        /**
         * Get chat messages
         */
        function getChatMessages(){
            vm.errorGetMessages = false;
            var resultsPromise = messageService.getProjectChatMessages(vm.projectId);
            resultsPromise.then(function (data) {
                vm.messages = data.chat;
                for (var i = 0; i < vm.messages.length; i++){
                    vm.messages[i].message = messageService.formatUserNamesToLink(vm.messages[i].message);
                }
                // set the location.hash to the id of the element to scroll to
                $timeout(function () {
                    if (!vm.hasScrolled){
                        $location.hash('bottom');
                        $anchorScroll();
                        vm.hasScrolled = true;
                    }
                }, 1000);
            }, function(response){
                vm.messages = [];
                if (response.status != 404) {
                    vm.errorGetMessages = true;
                }
            });
        }

         /**
         * Search for a user
         * @param searchValue
         */
        vm.searchUser = function (search) {
            // Search for a user by calling the API
            var resultsPromise = userService.searchUser(search);
            return resultsPromise.then(function (data) {
                // On success
                vm.usernames = [];
                if (data.usernames) {
                    for (var i = 0; i < data.usernames.length; i++) {
                        vm.usernames.push({'label': data.usernames[i]});
                    }
                }
                return data.usernames;
            }, function () {
                // On error
            });
        };

        /**
         * Formats the user tag
         * @param item
         */
        vm.formatUserTag = function (item) {
            // Format the user tag by wrapping into brackets so it is easier to detect that it is a username
            // especially when there are spaces in the username
            return '@[' + item.label + ']';
        };

        /**
         * Add message to the chat
         */
        vm.addMessage = function(){
            vm.successMessageAdded = false;
            vm.errorMessageAdded = false;
            var resultsPromise = messageService.addProjectChatMessage(vm.message, vm.projectId);
            resultsPromise.then(function (data) {
                vm.messages = data.chat;
                for (var i = 0; i < vm.messages.length; i++){
                    vm.messages[i].message = messageService.formatUserNamesToLink(vm.messages[i].message);
                }
                // set the location.hash to the id of the element to scroll to
                $timeout(function () {
                    // TODO: find out if it is possible remove location hash 
                    $anchorScroll(['bottom']);
                }, 1000);
                vm.message = '';
                vm.successMessageAdded = true;
            }, function(response){
                if (response.status !== '404') {
                    vm.errorMessageAdded = true;
                }
            });
        };

        /**
         * Message the project manager by pre-populating the message
         */
        vm.messageProjectManager = function(){
            vm.errorAddPMUsername = false;
            var author = '@[' + vm.author + ']';
            if ((vm.message.length + author.length) < vm.maxlengthComment){
                vm.message += author;
            }
            else {
                vm.errorAddPMUsername = true;
            }
        }
    }
})();