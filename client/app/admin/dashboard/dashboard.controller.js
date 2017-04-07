(function () {

    'use strict';

    /**
     * Dashboard controller which manages the dashboard page
     */
    angular
        .module('taskingManager')
        .controller('dashboardController', ['mapService', dashboardController]);

    function dashboardController(mapService) {
        var vm = this;

        vm.projects = [
            {
                id: 1,
                name: 'Osun State Road Network Mapping for Vaccine Delivery Routing, Nigeria',
                portfolio: 'Name of portfolio',
                percentageMapped: '45',
                percentageValidated: '33',
                createdBy: 'LindaA1'
            },
            {
                id: 2,
                name: 'Missing Maps - Goma, RDC - Water and Sanitation',
                portfolio: 'Name of portfolio',
                percentageMapped: '66',
                percentageValidated: '11',
                createdBy: 'IF'
            }
        ];

        // Stats
        vm.selectedProject = {};
        vm.mappedData = [];
        vm.mappedLabels = [];
        vm.validatedData = [];
        vm.validatedLabels = [];
        vm.levelData = [];
        vm.levelLabels = [];

        // Filter
        vm.searchText = {};
       
        // Order
        vm.propertyName = 'id';
        vm.reverse = true;

        activate();

        function activate(){
            mapService.createOSMMap('map');
            vm.map = mapService.getOSMMap();
            var lastProjectIndex = vm.projects.length - 1;
            setGraphVariables(lastProjectIndex);
        }

        /**
         * Select a project and show graphs
         * @param index
         */
        vm.selectProject = function(index){
            setGraphVariables(index);
        };

        /**
         * Sorts the table by property name
         * @param propertyName
         */
        vm.sortBy = function(propertyName){
            vm.reverse = (vm.propertyName === propertyName) ? !vm.reverse : false;
            vm.propertyName = propertyName;
        };

        /**
         * Set the graph variables for a project by providing the index of the project in the projects array
         * @param index
         */
        function setGraphVariables(index){
            vm.selectedProject = vm.projects[index];
            // Tasks mapped
            vm.mappedData = [vm.selectedProject.percentageMapped, 100 - vm.selectedProject.percentageMapped];
            vm.mappedLabels = ['Mapped', 'Not mapped'];
            // Tasks validated
            vm.validatedData = [vm.selectedProject.percentageValidated, 100 - vm.selectedProject.percentageValidated];
            vm.validatedLabels = ['Validated', 'Not validated'];
            // Level of mappers - TODO
            vm.levelData = [20, 30, 50];
            vm.levelLabels = ['Beginner', 'Intermediate', 'Advanced'];
        }
    }
})();
