(function () {

    'use strict';

    /**
     * Dashboard controller which manages the dashboard page
     */
    angular
        .module('taskingManager')
        .controller('dashboardController', [dashboardController]);

    function dashboardController() {
        var vm = this;

        vm.projects = [
            {
                id: 1,
                name: 'Project 1',
                portfolio: 'Name of portfolio',
                percentageMapped: '45',
                percentageValidated: '33',
                createdBy: 'LA'
            },
            {
                id: 2,
                name: 'Project 2',
                portfolio: 'Name of portfolio',
                percentageMapped: '66',
                percentageValidated: '11',
                createdBy: 'IF'
            }
        ]
    }
})();
