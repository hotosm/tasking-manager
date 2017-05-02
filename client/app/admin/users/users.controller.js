(function () {

    'use strict';

    /**
     * Users controller which manages the user list
     */
    angular
        .module('taskingManager')
        .controller('usersController', ['$location', 'userService', usersController]);

    function usersController($location, userService) {
        var vm = this;

        // Filter
        vm.searchText = {};

        // Paging results
        vm.itemsPerPage = 5;
        vm.currentPage = 1;

        // Pagination
        vm.pagination = {};

        // Search params
        vm.role = '';
        vm.level = '';
        vm.username = '';
        vm.page = 1;
        
        vm.users = [];
        
        activate();

        function activate() {
            getUsers(1, '', '', '');
        }
        
        /**
         * Gets users after changing the search parameter 
         */
        vm.searchUsers = function(){
            getUsers(vm.page, vm.role, vm.level, vm.username);
        };

        /**
         * Gets users with a specific page
         */
        vm.searchUsersWithPage = function(page){
            getUsers(page, vm.role, vm.level, vm.username);
        };

        /**
         * Get the users
         * @param page
         * @param role
         * @param level
         * @param username
         * @returns {!jQuery.deferred|!jQuery.jqXHR|!jQuery.Promise}
         */
        function getUsers(page, role, level, username){
            var pageParam = page || 1;
            var roleParam = role || '';
            var levelParam = level || '';
            var usernameParam = username || '';
            var resultsPromise = userService.searchAllUsers(pageParam, roleParam, levelParam, usernameParam);
            resultsPromise.then(function (data) {
                // On success
                vm.users = data.users;
                vm.pagination = data.pagination;
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
