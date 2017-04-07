(function () {

    'use strict';

    /**
     * Dashboard controller which manages the dashboard page
     */
    angular
        .module('taskingManager')
        .controller('dashboardController', ['mapService', 'projectMapService', dashboardController]);

    function dashboardController(mapService, projectMapService) {
        var vm = this;

        // TODO: get projects + mapper level stats from the API.
        vm.projects = [
            {
                id: 1,
                name: 'Osun State Road Network Mapping for Vaccine Delivery Routing, Nigeria',
                portfolio: 'Name of portfolio',
                percentageMapped: '45',
                percentageValidated: '33',
                levelMappers: [20, 30, 50],
                createdBy: 'LindaA1',
                aoiCentroid: {
                    coordinates: [34.3433748084466, 31.003454415691]
                }
            },
            {
                id: 2,
                name: 'Missing Maps - Goma, RDC - Water and Sanitation',
                portfolio: 'Name of portfolio',
                percentageMapped: '66',
                percentageValidated: '11',
                levelMappers: [10, 45, 45],
                createdBy: 'IF',
                aoiCentroid: {
                    coordinates: [-51.3464801406698, -11.5096335806906]
                }
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
            //TODO: get projects from API
            if (vm.projects) {
                var lastProjectIndex = vm.projects.length - 1;
                setGraphVariables(lastProjectIndex);
                projectMapService.initialise(vm.map);
                projectMapService.showProjectsOnMap(vm.projects);
                projectMapService.highlightProjectOnMap(vm.projects, vm.projects[lastProjectIndex].id);
            }
        }

        /**
         * Select a project, show graphs and highlight on map
         * @param projectId
         */
        vm.selectProject = function(projectId){
            var index = -1;
            for (var i = 0; i < vm.projects.length; i++){
                if (vm.projects[i].id == projectId){
                    index = i;
                }
            }
            if (index != -1){
                setGraphVariables(index);
                projectMapService.highlightProjectOnMap(vm.projects, projectId);
            }
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
            vm.levelData = vm.selectedProject.levelMappers;
            vm.levelLabels = ['Beginner', 'Intermediate', 'Advanced'];
        }
    }
})();
