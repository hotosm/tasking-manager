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
        vm.projects = {};

        // Stats
        vm.selectedProject = {};
        vm.mappedData = [];
        vm.mappedLabels = [];
        vm.validatedData = [];
        vm.validatedLabels = [];

        // Comments
        vm.projectComments = [];

        // Filter
        vm.searchText = '';
       
        // Order
        vm.propertyName = 'id';
        vm.reverse = true;

        // Show lists
        vm.showActive = true;
        vm.showDraft = false;
        vm.showArchived = false;

        // Errors
        vm.errorReturningProjects = false

        activate();

        function activate(){
            mapService.createOSMMap('map');
            vm.map = mapService.getOSMMap();
            projectMapService.initialise(vm.map);
            projectMapService.addPopupOverlay();
            getProjects();
        }

        /**
         * Sorts the table by property name
         * @param propertyName
         */
        vm.sortBy = function(propertyName){
            vm.reverse = (vm.propertyName === propertyName) ? !vm.reverse : false;
            vm.propertyName = propertyName;
        };

        /**
         * Toggle active
         */
        vm.toggleActive = function(){
            vm.showActive = !vm.showActive;
        };

        /**
         * Toggle completed
         */
        vm.toggleDraft = function(){
            vm.showDraft = !vm.showDraft;
        };

        /**
         * Toggle archived
         */
        vm.toggleArchived = function(){
            vm.showArchived = !vm.showArchived;
        };

        /**
         * Get the projects for the logged in user
         */
        function getProjects(){
            vm.errorReturningProjects = false;
            var resultsPromise = projectService.getMyProjects();
            resultsPromise.then(function (data) {
                // Return the projects successfully
                vm.projects = data;
                showOnMap(vm.projects);
            }, function(){
                // an error occurred
                vm.errorReturningProjects = true;
                vm.projects = {};
            });
        }

        /**
         * Show projects on map
         * @param projects
         */
        function showOnMap(projects){
            if (projects.activeProjects) {
                projectMapService.showProjectsOnMap(projects.activeProjects, "red", false);
            }
            if (projects.draftProjects) {
                projectMapService.showProjectsOnMap(projects.draftProjects, "blue", true);
            }
            if (projects.archivedProjects) {
                projectMapService.showProjectsOnMap(projects.archivedProjects, "black", true);
            }
        }
    }
})();
