(function () {

    'use strict';

    /**
     * @fileoverview This file provides a account navigation directive.
     */

    angular
        .module('taskingManager')
        .controller('accountNavController', ['$scope','$location', '$interval', '$document','$element', 'accountService','authService', 'messageService', accountNavController])
        .directive('accountNav', accountNavDirective);

    /**
     * Creates account-nav directive
     * Example:
     *
     * <account-nav></account-nav>
     */
    function accountNavDirective() {

        var directive = {
            restrict: 'EA',
            templateUrl: 'app/components/account-nav/account-nav.html',
            controller: 'accountNavController',
            controllerAs: 'accountNavCtrl',
            bindToController: true // because the scope is isolated
        };

        return directive;
    }

    function accountNavController($scope, $location, $interval, $document, $element, accountService, authService, messageService) {

        var vm = this;
        vm.account = {};
        vm.showDropdown = false;
        vm.userMessages = null;
        vm.newMessageNotification = true;

        // Watch the accountService for changes and update when needed
        $scope.$watch(function () {
            return accountService.getAccount();
        }, function (account) {
            vm.account = account;
            if (vm.account.username){
                checkIfUserHasMessages();
            }
        }, true);

        activate();

        function activate() {
            //start up a timer for autorefreshing the user messages.
            $interval(function () {
                if (vm.account.username) {
                    checkIfUserHasMessages();
                }
            }, 10000);

            // Catch clicks and check if it was outside of the menu element. If so, close the dropdown menu.
            $document.bind('click', function(event){
                var isClickedElementChildOfPopup = $element
                  .find(event.target)
                  .length > 0;
                if (isClickedElementChildOfPopup)
                  return;

                vm.showDropdown = false;
                $scope.$apply();
            });
        }

        /**
         * Login by going to OpenStreetMap
         */
        vm.login = function () {
            authService.login();
        };

        /**
         * Log the user out by resetting the local storage ('cookies')
         */
        vm.logout = function () {
            authService.logout();
            $location.path('/');
            vm.showDropdown = false;
        };

        /**
         * Navigate to the user's profile
         */
        vm.goToProfile = function () {
            $location.path('user/' + vm.account.username);
            vm.showDropdown = false;
        };

        /**
         * Navigate to the create project page
         */
        vm.goToCreateNewProject = function () {
            $location.path('admin/create-project');
            vm.showDropdown = false;
        };

        /**
         * Navigate to the licence management page
         */
        vm.goToManageLicenses = function () {
            $location.path('admin/licenses');
            vm.showDropdown = false;
        };

        /**
         * Navigate to the project dashboard page
         */
        vm.goToProjectDashboard = function () {
            $location.path('admin/dashboard');
            vm.showDropdown = false;
        };

        /**
         * Navigate to the user list page
         */
        vm.goToUserList = function () {
            $location.path('admin/users');
            vm.showDropdown = false;
        };
        
        /**
         * Go to the messages page
         */
        vm.goToMessages = function () {
            $location.path('inbox');
            vm.showDropdown = false;
        };

        /**
         * Hide new message notification
         */
        vm.hideNotification = function(){
           vm.newMessageNotification = false;
        };

        /**
         * Toggle the menu
         */
        vm.toggleMenu = function(event){
            vm.showDropdown = !vm.showDropdown;
            // Do not let the event propagate. Otherwise it would check if the click was inside the menu div and
            // always close the dropdown menu
            event.stopPropagation();
        };

        /**
         * Check if the user has new messages
         */
        function checkIfUserHasMessages() {
            var resultsPromise = messageService.hasNewMessages();
            resultsPromise.then(function (data) {
                // success
                vm.userMessages = data;
            }, function () {
                // an error occurred
            });
        }
    }
})();