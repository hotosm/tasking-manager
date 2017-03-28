(function () {

    'use strict';

    /**
     * @fileoverview This file provides a account navigation directive.
     */

    angular
        .module('taskingManager')
        .controller('accountNavController', ['$scope','accountService','authService', accountNavController])
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

    function accountNavController($scope, accountService, authService) {
        
        var vm = this;
        vm.firstName = '';

        // Watch the accountService for changes and update when needed
        $scope.$watch(function(){ return accountService.getAccount();}, function(account){
            vm.firstName = account.firstName;
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
        }
    }
})();