(function () {

    'use strict';

    /**
     * Dashboard controller which manages the dashboard page
     */
    angular
        .module('taskingManager')
        .controller('projectDashboardController', ['mapService', 'projectMapService', 'projectService', projectDashboardController]);

    function projectDashboardController(mapService, projectMapService, projectService) {
        var vm = this;

        // TODO: get projects + mapper level stats from the API.
        vm.project = {
            id: 521,
            name: 'Hardcoded project name',
            portfolio: 'Name of portfolio',
            percentageMapped: '45',
            percentageValidated: '33',
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

        // Stats
        vm.mappedData = [];
        vm.mappedLabels = [];
        vm.validatedData = [];
        vm.validatedLabels = [];

        // Comments
        vm.projectComments = [];

        activate();

        function activate(){
            mapService.createOSMMap('map');
            vm.map = mapService.getOSMMap();
            //TODO: get projects from API
            if (vm.project) {
                setGraphVariables();
                setComments(vm.project.id);
                projectMapService.initialise(vm.map);
                projectMapService.showProjectOnMap(vm.project);
            }
        }

        /**
         * Set the graph variables for a project by providing the index of the project in the projects array
         */
        function setGraphVariables(){
            // Tasks mapped
            vm.mappedData = [vm.project.percentageMapped, 100 - vm.project.percentageMapped];
            vm.mappedLabels = ['Mapped', 'Not mapped'];
            // Tasks validated
            vm.validatedData = [vm.project.percentageValidated, 100 - vm.project.percentageValidated];
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
            }, function(data){
               // TODO
            });
        }
    }
})();
