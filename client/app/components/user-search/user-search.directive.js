(function () {

    'use strict';

    /**
     * @fileoverview This file provides a typeahead user search directive.
     */

    angular
        .module('taskingManager')
        .controller('userSearchController', ['$location', 'userService', userSearchController])
        .directive('userSearch', userSearchDirective);

    /**
     * Creates user-search directive
     * Example:
     *
     * <user-search></user-search>
     */
    function userSearchDirective() {

        var directive = {
            restrict: 'EA',
            templateUrl: 'app/components/user-search/user-search.html',
            controller: 'userSearchController',
            controllerAs: 'userSearchCtrl',
            bindToController: true // because the scope is isolated
        };

        return directive;
    }

    function userSearchController($location, userService) {

        var vm = this;
        
         /**
         * Get the user for a search value
         * @param searchValue
         */
        vm.getUser = function(searchValue){
            var resultsPromise = userService.searchUser(searchValue);
            return resultsPromise.then(function (data) {
                // On success
                return data.usernames;
            }, function(){
                // On error
            });
        };

        /**
         * Select a user
         * @param username
         */
        vm.selectUser = function(username) {
            $location.path('/user/' + username);
        };
    }
})();