(function () {

    'use strict';

    /**
     * Profile controller which manages the user profiles
     */
    angular
        .module('taskingManager')
        .controller('profileController', ['$routeParams', '$location', 'accountService','mapService', 'geospatialService', profileController]);

    function profileController($routeParams, $location, accountService, mapService, geospatialService) {
        var vm = this;
        vm.username = '';
        vm.currentlyLoggedInUser = null;
        vm.userDetails = null;
        vm.osmUserDetails = null;
        vm.projects = [];
        vm.map = null;
        vm.highlightSource = null;

        activate();

        function activate() {
            vm.username = $routeParams.id;
            setUserDetails();
            mapService.createOSMMap('map');
            vm.map = mapService.getOSMMap();

            // add vector layers
            vm.highlightSource = new ol.source.Vector();
            setUserProjects();
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
        function setUserProjects(){
            vm.projects = [
                {
                    id: 1,
                    name: 'Cyclone Enawo: Anjanazan, Madagascar 1',
                    tasksMapped: 3,
                    tasksValidated: 5,
                    status: 'active',
                    centroid: [-2.207, 24.2578],
                    lastUpdated: '2017-03-31T10:48:41.161085'
                },
                {
                    id: 222,
                    name: 'Missing Maps: Zambia Malaria Elimination 46',
                    tasksMapped: 30,
                    tasksValidated: 50,
                    status: 'active',
                    centroid: [-0.489, 51.28],
                    lastUpdated: '2017-04-04T15:51:21.135789'
                },
                {
                    id: 21,
                    name: 'Osun State Road Network Mapping for Vaccine Delivery Routing, Nigeria',
                    tasksMapped: 300,
                    tasksValidated: 500,
                    status: 'active',
                    centroid: [6.915, 0.703],
                    lastUpdated: '2017-04-04T15:51:21.135789'
                }
            ];
            showProjectsOnMap_();
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
            vm.highlightSource.clear();
        };

        /**
         * Highlight project on map by showing a highlights layer
         */
        vm.highlightProjectOnMap = function(id){

            // clear any existing highlighted projects from the map
            vm.highlightSource.clear();

            var fill = new ol.style.Fill({
                color: [255, 0, 0, 1],
                width: 1
            });
            var stroke = new ol.style.Stroke({
                color: [255, 0, 0, 1],
                width: 1
            });
            var highlightStyle = new ol.style.Style({
                image: new ol.style.Circle({
                    fill: fill,
                    stroke: stroke,
                    radius: 8
                })
            });

            var highlightLayer = new ol.layer.Vector({
                source: vm.highlightSource,
                style: highlightStyle
            });
            vm.map.addLayer(highlightLayer);

            // iterate over the projects and if the ID of the project matches the one provided
            // add the project's center as a feature to the layer on the map
            for (var i = 0; i < vm.projects.length; i++){
                if (vm.projects[i].id == id){
                    var projectCenter = ol.proj.transform(vm.projects[i].centroid, 'EPSG:4326', 'EPSG:3857');
                    var feature = new ol.Feature({
                        geometry: new ol.geom.Point(projectCenter)
                    });
                    vm.highlightSource.addFeature(feature);
                }
            }
        };

        /**
         * Show the projects on the map
         * @private
         */
        function showProjectsOnMap_(){

            var fill = new ol.style.Fill({
                color: [255, 0, 0, 0.5],
                width: 1
            });
            var stroke = new ol.style.Stroke({
                color: [255, 0, 0, 1],
                width: 1
            });
            var style = new ol.style.Style({
                image: new ol.style.Circle({
                    fill: fill,
                    stroke: stroke,
                    radius: 5
                })
            });

            var vectorSource = new ol.source.Vector();
            var vectorLayer = new ol.layer.Vector({
                source: vectorSource,
                style: style
            });
            vm.map.addLayer(vectorLayer);

            // iterate over the projects and add the center of the project as a point on the map
            for (var i = 0; i < vm.projects.length; i++){
                var projectCenter = ol.proj.transform(vm.projects[i].centroid, 'EPSG:4326', 'EPSG:3857');
                var feature = new ol.Feature({
                    geometry: new ol.geom.Point(projectCenter)
                });
                vectorSource.addFeature(feature);
            }
        }
    }
})();
