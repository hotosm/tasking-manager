(function () {

    'use strict';

    /**
     * Dashboard controller which manages the dashboard page
     */
    angular
        .module('taskingManager')
        .controller('projectDashboardController', ['$routeParams', 'mapService', 'projectMapService', 'projectService', 'statsService', projectDashboardController]);

    function projectDashboardController($routeParams, mapService, projectMapService, projectService, statsService) {
        var vm = this;
        vm.projectId = 0;
        
        // TODO: get projects + mapper level stats from the API.
        vm.project = {
            id: 521,
            name: 'Hardcoded project name',
            portfolio: 'Name of portfolio',
            percentMapped: '45',
            percentValidated: '33',
            createdBy: 'LindaA1',
            aoiCentroid: {
                coordinates: [34.3433748084466, 31.003454415691]
            }
        };

        vm.projectActivityPagination = [];
        vm.projectActivity = [];
        vm.projectContributions = [];

        // Comments
        vm.projectComments = [];

        activate();

        function activate(){
            vm.projectId = $routeParams.id;
            mapService.createOSMMap('map');
            vm.map = mapService.getOSMMap();
            //TODO: get projects from API
            getProjectStats(vm.projectId);
            getComments(vm.projectId);
            getProjectContributions(vm.projectId);
            getProjectActivity(vm.projectId);
            projectMapService.initialise(vm.map);
        }

        /**
         * Get last activity with page number
         * @param page
         */
        vm.getLastActivity = function(page){
            getProjectActivity(vm.projectId, page)
        };

        /**
         * Get project stats
         * @param projectId
         */
        function getProjectStats(projectId){
            var resultsPromise = statsService.getProjectStats(projectId);
            resultsPromise.then(function (data) {
                vm.project = data;
                projectMapService.showProjectOnMap(vm.project);
            }, function(data){
               // TODO
            });
        }

        /**
         * Get the project's comments
         * @param projectId
         */
        function getComments(projectId){
            var resultsPromise = projectService.getCommentsForProject(projectId);
            resultsPromise.then(function (data) {
                vm.projectComments = data.comments;
            }, function(data){
               // TODO
            });
        }

        /**
         * Get the project contributions
         */
        function getProjectContributions(projectId){
             var resultsPromise = statsService.getProjectContributions(projectId);
            resultsPromise.then(function (data) {
                // Return the projects successfully
                vm.projectContributions = data.userContributions;
            }, function(){
                // an error occurred
                vm.projectContributions = [];
            });
        }

        /**
         * Get project activyt
         * @param projectId
         * @param page - optional
         */
        function getProjectActivity(projectId, page){
            console.log("GET PROJECT ACTIVITY");
            var resultsPromise = statsService.getProjectActivity(projectId, page);
            resultsPromise.then(function (data) {
               // Return the projects successfully
                console.log(data.pagination);
                vm.projectActivityPagination = data.pagination;
                vm.projectActivity = data.activity;
                console.log(vm.projectActivity);
            }, function(){
                // an error occurred
                vm.projectActivityPagination = data.pagination;
                vm.projectActivity = [];
            });
        }
    }
})();
