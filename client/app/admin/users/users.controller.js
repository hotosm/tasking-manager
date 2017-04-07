(function () {

    'use strict';

    /**
     * Users controller which manages the user list
     */
    angular
        .module('taskingManager')
        .controller('usersController', [profileController]);

    function profileController() {
        var vm = this;

        // Filter
        vm.searchText = {};

        // Paging results
        vm.itemsPerPage = 5;
        vm.currentPage = 1;

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
