(function () {

    'use strict';

    /**
     * Users controller which manages the user list
     */
    angular
        .module('taskingManager')
        .controller('usersController', ['$scope', '$location', '$translate', 'userService', 'languageService', usersController]);

    function usersController($scope, $location, $translate, userService, languageService) {
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
        
        // Error
        vm.errorGetUsers = false;
        
        // Locale
        vm.locale = 'en';
        
        vm.users = [];
        
        activate();

        function activate() {
            getUsers(1, '', '', '');
            vm.locale = $translate.use();
        }

         // Watch the languageService for change in language and update the locale when needed
        $scope.$watch(function () {
            return languageService.getLanguageCode();
        }, function () {
            vm.locale = $translate.use();
        }, true);
        
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
            vm.errorGetUsers = false;
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
                vm.errorGetUsers = true;
            });
        }

        /**
         * Select a user
         * @param username
         */
        vm.selectUser = function(username) {
            $location.path('/user/' + username);
        };
    }
})();
