(function () {

    'use strict';

    /**
     * Dashboard controller which manages the dashboard page
     */
    angular
        .module('taskingManager')
        .controller('dashboardController', ['mapService', 'projectMapService', 'projectService', dashboardController]);

    function dashboardController(mapService, projectMapService, projectService) {
        var vm = this;

        // TODO: get projects + mapper level stats from the API.
        vm.projects = [
            {
                id: 186,
                name: 'Hardcoded project name',
                portfolio: 'Name of portfolio',
                percentageMapped: '45',
                percentageValidated: '33',
                createdBy: 'LindaA1',
                aoiCentroid: {
                    coordinates: [34.3433748084466, 31.003454415691]
                }
            },
            {
                id: 236,
                name: 'Hardcoded project name 2',
                portfolio: 'Name of portfolio',
                percentageMapped: '66',
                percentageValidated: '11',
                createdBy: 'IF',
                aoiCentroid: {
                    coordinates: [-51.3464801406698, -11.5096335806906]
                }
            },
            {
                id: 159,
                name: 'Hardcoded project name 3',
                portfolio: 'Name of portfolio',
                percentageMapped: '66',
                percentageValidated: '11',
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

        // Comments
        vm.projectComments = [];

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
                // TODO: look at ordering and which one to select by default
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
            vm.projectComments = [];
            var index = -1;
            for (var i = 0; i < vm.projects.length; i++){
                if (vm.projects[i].id == projectId){
                    index = i;
                }
            }
            if (index != -1){
                setGraphVariables(index);
                setComments(projectId);
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
        }

        /**
         * Set the project's comments
         * @param projectId
         */
        function setComments(projectId){
            var resultsPromise = projectService.getCommentsForProject(projectId);
            resultsPromise.then(function (data) {
                vm.projectComments = data.comments;
            }, function(){
               // TODO
            });
        }
    }
})();
