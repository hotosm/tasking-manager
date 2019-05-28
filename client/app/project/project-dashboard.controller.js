(function () {

    'use strict';

    /**
     * Dashboard controller which manages the dashboard page
     */
    angular
        .module('taskingManager')
        .controller('projectDashboardController', ['$scope', '$routeParams', 'NgTableParams', 'mapService', 'projectMapService', 'projectService', 'statsService', 'configService', 'TaskStatus', projectDashboardController]);



    function projectDashboardController($scope, $routeParams, NgTableParams, mapService, projectMapService, projectService, statsService, configService, TaskStatus) {
        var vm = this;
        $scope.TaskStatus = TaskStatus;
        $scope.tmAPI = configService.tmAPI;
        vm.projectId = 0;

        vm.project = {};
        vm.projectContributions = [];
        vm.projectComments = [];
        vm.statusStats = [];

        // Setup tables for Status Overview and Last Activity
        vm.projectActivityPagination = [];
        vm.projectActivity = [];
        vm.projectOverviewPagination = [];
        vm.projectOverview = [];

        vm.statusFilterLabels = [
            { title: 'All', id: '' },
        ].concat([
            TaskStatus.MAPPED, TaskStatus.VALIDATED, TaskStatus.INVALIDATED, TaskStatus.BADIMAGERY,
            TaskStatus.LOCKED_FOR_MAPPING, TaskStatus.LOCKED_FOR_VALIDATION, TaskStatus.READY,
        ].map(function(status) {
            return { title: status.title, id: status.value };
        }));

        vm.statusFilterDefinition = {
            status: { id: "select" },
        };

        vm.overviewTableSettings = new NgTableParams({
            sorting: { updatedDate: "desc", taskId: "asc" },
            count: 10,
        }, {
            counts: [10, 25, 50, 100],
            filterOptions: { filterLayout: "horizontal" },
            getData: function(params) {
                var sortBy = Object.keys(params.sorting())[0]
                return statsService.getProjectOverview(
                    vm.projectId, params.page(), params.count(),
                    sortBy, sortBy ? params.sorting()[sortBy] : undefined,
                    params.filter().mapperName,
                    params.filter().validatorName,
                    params.filter().status,
                    vm.projectId > 0 ? undefined : params.filter().projectTitle // for all-projects filtering
                ).then(function(data) {
                    // Return the tasks successfully
                    vm.projectOverviewPagination = data.pagination;
                    vm.projectOverview = data.tasks
                    params.total(data.pagination.total)

                    return vm.projectOverview
                }, function(e) {
                    // an error occurred
                    vm.projectOverviewPagination = [];
                    vm.projectOverview = [];
                });
            },
        });

        vm.activityTableSettings = new NgTableParams({
            sorting: { actionDate: "desc" },
            count: 10,
        }, {
            counts: [10, 25, 50, 100],
            filterOptions: { filterLayout: "horizontal" },
            getData: function(params) {
                var sortBy = Object.keys(params.sorting())[0]
                return statsService.getProjectActivity(
                    vm.projectId, params.page(), params.count(),
                    sortBy, sortBy ? params.sorting()[sortBy] : undefined,
                    params.filter().actionBy,
                    params.filter().status,
                    vm.projectId > 0 ? undefined : params.filter().projectTitle // for all-projects filtering
                ).then(function(data) {
                    // Return the projects successfully
                    vm.projectActivityPagination = data.pagination;
                    vm.projectActivity = data.activity
                    params.total(data.pagination.total)

                    return vm.projectActivity
                }, function(e) {
                    // an error occurred
                    vm.projectActivityPagination = [];
                    vm.projectActivity = [];
                });
            },
        });

        activate();

        function activate(){
            vm.projectId = $routeParams.id;
            vm.singleProject = vm.projectId > 0;

            if (vm.singleProject) {
              mapService.createOSMMap('map');
              vm.map = mapService.getOSMMap();

              getProjectStats(vm.projectId);
              getComments(vm.projectId);
              getProjectContributions(vm.projectId);
              projectMapService.initialise(vm.map);
            }
        }

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
                vm.statusStats = taskStatusStats();
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
         * Package up basic stats for each appropriate task status based on the
         * project data, including the count and percentage of tasks in each
         * status
         */
        function taskStatusStats(){
            return [
                TaskStatus.READY, TaskStatus.MAPPED, TaskStatus.VALIDATED, TaskStatus.INVALIDATED,
                TaskStatus.BADIMAGERY, TaskStatus.LOCKED_FOR_MAPPING, TaskStatus.LOCKED_FOR_VALIDATION,
            ].map(function(status) {
                var fieldName = "tasks" + status.title.replace(/\s/g, '');
                var stats = {
                  title: status.title,
                  count: vm.project[fieldName],
                  percent: null,
                };

                if (typeof stats.count !== 'undefined' && vm.project.totalTasks > 0) {
                  stats.percent = ((stats.count / vm.project.totalTasks) * 100.0).toFixed(1);
                }

                return stats;
            });
        }
    }
})();
