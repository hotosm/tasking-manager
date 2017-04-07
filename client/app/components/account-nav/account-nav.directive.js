(function () {

    'use strict';

    /**
     * @fileoverview This file provides a account navigation directive.
     */

    angular
        .module('taskingManager')
        .controller('accountNavController', ['$scope','$location','accountService','authService', accountNavController])
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

    function accountNavController($scope, $location, accountService, authService) {
        
        var vm = this;
        vm.account = {};
        vm.showDropdown = false;

        // Watch the accountService for changes and update when needed
        $scope.$watch(function(){ return accountService.getAccount();}, function(account){
            vm.account = account;
        }, true);

        /**
         * Login by going to OpenStreetMap
         */
        vm.login = function(){
            authService.login();
        };
        
        /**
         * Log the user out by resetting the local storage ('cookies')
         */
        vm.logout = function(){
            authService.logout();
            $location.path('/');
            vm.showDropdown = false;
        };

        /**
         * Navigate to the user's profile
         */
        vm.navigateToProfile = function(){
            $location.path('user/' + vm.account.username);
            vm.showDropdown = false;
        };

        /**
         * Navigate to the create project page
         */
        vm.goToCreateNewProject = function(){
            $location.path('admin/create-project');
            vm.showDropdown = false;
        };

        /**
         * Navigate to the licence management page
         */
        vm.goToManageLicenses = function(){
            $location.path('admin/licenses');
            vm.showDropdown = false;
        }

        /**
         * Navigate to the project dashboard page
         */
        vm.goToProjectDashboard = function(){
            $location.path('admin/dashboard');
            vm.showDropdown = false;
        }
    }
})();