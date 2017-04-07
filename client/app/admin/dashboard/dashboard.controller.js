(function () {

    'use strict';

    /**
     * Dashboard controller which manages the dashboard page
     */
    angular
        .module('taskingManager')
        .controller('dashboardController', ['mapService', dashboardController]);

    function dashboardController(mapService) {
        var vm = this;

        // TODO: get projects + mapper level stats from the API.
        vm.projects = [
            {
                id: 1,
                name: 'Osun State Road Network Mapping for Vaccine Delivery Routing, Nigeria',
                portfolio: 'Name of portfolio',
                percentageMapped: '45',
                percentageValidated: '33',
                levelMappers: [20, 30, 50],
                createdBy: 'LindaA1',
                aoiCentroid: {
                    coordinates: [34.3433748084466, 31.003454415691]
                }
            },
            {
                id: 2,
                name: 'Missing Maps - Goma, RDC - Water and Sanitation',
                portfolio: 'Name of portfolio',
                percentageMapped: '66',
                percentageValidated: '11',
                levelMappers: [10, 45, 45],
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
        vm.levelData = [];
        vm.levelLabels = [];

        // Filter
        vm.searchText = {};
       
        // Order
        vm.propertyName = 'id';
        vm.reverse = true;

        activate();

        function activate(){
            mapService.createOSMMap('map');
            vm.map = mapService.getOSMMap();
            var lastProjectIndex = vm.projects.length - 1;
            setGraphVariables(lastProjectIndex);
            addVectorLayer_();
            showProjectsOnMap_();
        }

        /**
         * Select a project and show graphs
         * @param projectId
         */
        vm.selectProject = function(projectId){
            var index = 0;
            for (var i = 0; i < vm.projects.length; i++){
                if (vm.projects[i].id == projectId){
                    index = i;
                }
            }
            setGraphVariables(index);
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
            // Level of mappers - TODO
            vm.levelData = vm.selectedProject.levelMappers;
            vm.levelLabels = ['Beginner', 'Intermediate', 'Advanced'];
        }

        /**
         * Add vector layer for the project results
         */
        function addVectorLayer_(){

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

            vm.vectorSource = new ol.source.Vector();
            var vectorLayer = new ol.layer.Vector({
                source: vm.vectorSource,
                style: style
            });
            vm.map.addLayer(vectorLayer);
        }

        /**
         * Show the projects on the map
         * @private
         */
        function showProjectsOnMap_(){

            vm.vectorSource.clear();

            // iterate over the projects and add the center of the project as a point on the map
            for (var i = 0; i < vm.projects.length; i++){
                var projectCenter = ol.proj.transform(vm.projects[i].aoiCentroid.coordinates, 'EPSG:4326', 'EPSG:3857');
                var feature = new ol.Feature({
                    geometry: new ol.geom.Point(projectCenter)
                });
                if (vm.vectorSource) {
                    vm.vectorSource.addFeature(feature);
                }
            }
        }
    }
})();
