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

        vm.project = {};
        vm.projectActivityPagination = [];
        vm.projectActivity = [];
        vm.projectContributions = [];
        vm.projectComments = [];

        activate();

        function activate(){
            vm.projectId = $routeParams.id;
            mapService.createOSMMap('map');
            vm.map = mapService.getOSMMap();
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
                var customColours = false;
                var zoomToProject = true;
                projectMapService.showProjectOnMap(vm.project, customColours, zoomToProject);
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
         * Get project activity
         * @param projectId
         * @param page - optional
         */
        function getProjectActivity(projectId, page){
            var resultsPromise = statsService.getProjectActivity(projectId, page);
            resultsPromise.then(function (data) {
               // Return the projects successfully
                vm.projectActivityPagination = data.pagination;
                vm.projectActivity = data.activity;
            }, function(){
                // an error occurred
                vm.projectActivityPagination = [];
                vm.projectActivity = [];
            });
        }
    }
})();
