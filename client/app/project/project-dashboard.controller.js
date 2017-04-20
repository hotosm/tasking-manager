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

        vm.projectActivity = [
            {
                username: 'LindaA1',
                taskId: '45',
                status: 'MAPPED',
                timeStamp: '2017-02-14T18:10:16Z'
            },
            {
                username: 'user 2',
                taskId: '45',
                status: 'INVALIDATED',
                timeStamp: '2017-03-14T18:10:16Z'
            },
            {
                username: 'user 67',
                taskId: '485',
                status: 'MAPPED',
                timeStamp: '2015-05-14T18:10:16Z'
            },
            {
                username: 'user 90',
                taskId: '458',
                status: 'INVALIDATED',
                timeStamp: '2015-05-14T18:10:16Z'
            }
        ];

        vm.projectContributions = [
            {
                username: 'LindaA1',
                level: 'BEGINNER',
                mapped: 12
            },
            {
                username: 'popeln',
                level: 'ADVANCED',
                mapped: 22
            }
        ];

        // Comments
        vm.projectComments = [];

        activate();

        function activate(){
            var projectId = $routeParams.id;
            mapService.createOSMMap('map');
            vm.map = mapService.getOSMMap();
            //TODO: get projects from API
            getComments(projectId);
            getProjectContributions(projectId);
            projectMapService.initialise(vm.map);
            projectMapService.showProjectOnMap(vm.project);
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
    }
})();
