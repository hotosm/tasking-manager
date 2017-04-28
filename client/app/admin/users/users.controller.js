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

        // TODO: get list of users from API
        vm.users = [
            {
                username: 'LindaA1',
                role: 'ADMIN',
                mappingLevel: 'BEGINNER'
            },
            {
                username: 'popeln',
                role: 'PROJECT_MANAGER',
                mappingLevel: 'ADVANCED'
            },
            {
                username: 'IanF',
                role: 'MAPPER',
                mappingLevel: 'INTERMEDIATE'
            },
             {
                username: 'LindaA1',
                role: 'ADMIN',
                mappingLevel: 'BEGINNER'
            },
            {
                username: 'IainH',
                role: 'PROJECT_MANAGER',
                mappingLevel: 'ADVANCED'
            },
            {
                username: 'IanF',
                role: 'MAPPER',
                mappingLevel: 'INTERMEDIATE'
            },
             {
                username: 'LindaA1',
                role: 'ADMIN',
                mappingLevel: 'BEGINNER'
            },
            {
                username: 'IainH',
                role: 'PROJECT_MANAGER',
                mappingLevel: 'ADVANCED'
            },
            {
                username: 'IanF',
                role: 'MAPPER',
                mappingLevel: 'INTERMEDIATE'
            },
             {
                username: 'LindaA1',
                role: 'ADMIN',
                mappingLevel: 'BEGINNER'
            },
            {
                username: 'IainH',
                role: 'PROJECT_MANAGER',
                mappingLevel: 'ADVANCED'
            },
            {
                username: 'IanF',
                role: 'MAPPER',
                mappingLevel: 'INTERMEDIATE'
            }
        ];
        
        activate();

        function activate() {
            
        }
    }
})();
