(function () {

    'use strict';

    /**
     * Profile controller which manages the user profiles
     */
    angular
        .module('taskingManager')
        .controller('profileController', ['$routeParams', '$location', 'accountService','mapService','projectMapService', profileController]);

    function profileController($routeParams, $location, accountService, mapService, projectMapService) {
        var vm = this;
        vm.username = '';
        vm.currentlyLoggedInUser = null;
        vm.userDetails = null;
        vm.osmUserDetails = null;
        vm.projects = [];
        vm.totalTasksMapped = 0;
        vm.totalTasksValidated = 0;
        vm.map = null;
        vm.highlightSource = null;

        activate();

        function activate() {
            vm.username = $routeParams.id;
            setUserDetails();
            mapService.createOSMMap('map');
            vm.map = mapService.getOSMMap();
            projectMapService.initialise(vm.map);
            setUserProjectsAndStats();
        }

        /**
         * Set user details by calling the APIs
         */
        function setUserDetails(){
            // Get account details from account service
            var resultsPromise = accountService.getUser(vm.username);
            resultsPromise.then(function (data) {
                // On success, set the account details for this user
                vm.userDetails = data;
                // Get the account for the currently logged in user
                var account = accountService.getAccount();
                if (account){
                    vm.currentlyLoggedInUser = account;
                }
            }, function () {
                // Could not find the user, redirect to the homepage
                $location.path('/');
            });

            // Get OSM account details from account service
            var osmDetailsPromise = accountService.getOSMUserDetails(vm.username);
            osmDetailsPromise.then(function (data) {
                // On success, set the OSM account details for this user
                vm.osmUserDetails = data;
            })
        }

        /**
         * Set the user's project
         * TODO: get from API
         */
        function setUserProjectsAndStats(){
            vm.totalTasksMapped = 45;
            vm.totalTasksValidated = 5;
            vm.projects = [
                {
                    id: 1,
                    name: 'Cyclone Enawo: Anjanazan, Madagascar 1',
                    tasksMapped: 3,
                    tasksValidated: 5,
                    status: 'active',
                    aoiCentroid: {
                        coordinates: [-2.207, 24.2578]
                    },
                    lastUpdated: '2017-03-31T10:48:41.161085'
                },
                {
                    id: 222,
                    name: 'Missing Maps: Zambia Malaria Elimination 46',
                    tasksMapped: 30,
                    tasksValidated: 50,
                    status: 'active',
                    aoiCentroid: {
                        coordinates: [-0.489, 51.28]
                    },
                    lastUpdated: '2017-04-04T15:51:21.135789'
                },
                {
                    id: 21,
                    name: 'Osun State Road Network Mapping for Vaccine Delivery Routing, Nigeria',
                    tasksMapped: 300,
                    tasksValidated: 500,
                    status: 'active',
                    aoiCentroid: {
                        coordinates: [6.915, 0.703]
                    },
                    lastUpdated: '2017-04-04T15:51:21.135789'
                }
            ];
            projectMapService.showProjectsOnMap(vm.projects);
        }

        /**
         * Navigate to the project contribute page
         * @param id
         */
        vm.navigateToProject = function(id){
            $location.path('/project/' + id);
        };

        /**
         * Remove all highlighted projects from the map
         */
        vm.removeHighlightOnMap = function(){
            projectMapService.removeHighlightOnMap();
        };

        /**
         * Highlight project on map by showing a highlights layer
         */
        vm.highlightProjectOnMap = function(id){
            console.log(vm.projects);
            projectMapService.highlightProjectOnMap(vm.projects, id);
        };
    }
})();
