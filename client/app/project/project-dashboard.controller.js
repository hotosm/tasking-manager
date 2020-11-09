(function () {

    'use strict';

    /**
     * Dashboard controller which manages the dashboard page
     */
    angular
        .module('taskingManager')
        .controller('projectDashboardController', ['$routeParams', 'mapService', 'projectMapService', 'projectService', 'statsService', 'mappingIssueService', projectDashboardController]);

    function projectDashboardController($routeParams, mapService, projectMapService, projectService, statsService, mappingIssueService) {
        var vm = this;
        vm.projectId = 0;

        vm.project = {};
        vm.projectActivityPagination = [];
        vm.projectActivity = [];
        vm.projectContributions = [];
        vm.projectComments = [];
        vm.detailedIssues = false;
        vm.hideZerosRows = false;

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
                projectMapService.showProjectOnMap(vm.project, vm.project.aoiCentroid, customColours, zoomToProject);
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

        /**
        * Get mapping issues for this project as a CSV file
        */
        vm.getMappingIssues = function() {
            var resultsPromise = mappingIssueService.getMappingIssues(vm.projectId, vm.detailedIssues, !vm.hideZerosRows);
            resultsPromise.then(function (data) {
                //create file from csv string and download
                var filename;
                if (vm.detailedIssues) {
                    filename = 'mapping_issues_project_' + vm.projectId + '_detailed.csv';
                }
                else {
                    filename = 'mapping_issues_project_' + vm.projectId + '.csv';
                }
                var csv = 'data:text/csv;charset=utf-8,' + data;
                var fileUri = encodeURI(csv);
                var link = document.createElement('a');
                link.setAttribute('href', fileUri);
                link.setAttribute('download', filename);
                link.click();
            }, function() {
                // On error
            });
        }
    }
})();
