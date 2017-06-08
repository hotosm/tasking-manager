(function () {

    'use strict';

    /**
     * @fileoverview This file provides a project chat directive.
     */

    angular
        .module('taskingManager')
        .controller('projectChatController', ['$scope', '$anchorScroll', '$location', '$timeout', 'messageService', 'userService', projectChatController])
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

    function projectChatController($scope, $anchorScroll, $location, $timeout, messageService, userService) {

        var vm = this;
        vm.projectId = 0;
        vm.author = '';
        vm.message = '';
        vm.messages = [];
        vm.maxlengthComment = 250;
        
        // Errors
        vm.successMessageAdded = false;
        vm.errorMessageAdded = false;
        vm.errorGetMessages = false;
        
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
                    $location.hash('bottom');
                    $anchorScroll();
                }, 1000);
            }, function(response){
                vm.messages = [];
                if (response.status != 404) {
                    console.log("404");
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
                    $location.hash('bottom');
                    $anchorScroll();
                }, 1000);
                vm.message = '';
                vm.successMessageAdded = true;
            }, function(response){
                if (response.status !== '404') {
                    vm.errorMessageAdded = true;
                }
            });
        }
    }
})();