(function () {

    'use strict';

    /**
     * Contribute controller which manages contributing to a project
     */
    angular
        .module('taskingManager')
        .controller('contributeController', ['mapService', 'searchService', contributeController]);

    function contributeController(mapService, searchService) {
        var vm = this;

        vm.results = [];
        vm.vectorSource = null;

        // Paging results
        vm.itemsPerPage = 4;
        vm.currentPage = 1;

        // Default to grid view
        vm.resultsView = 'grid';
        
        // Search parameters
        vm.mapperLevel = 'BEGINNER'; // default to beginner

        activate();

        function activate() {
            mapService.createOSMMap('map');
            searchProjects();
            vm.map = mapService.getOSMMap();
            addVectorLayer_();
        }

        /**
         * Search projects with search parameters
         */
        function searchProjects(){
            var resultsPromise = searchService.searchProjects(vm.mapperLevel);
            resultsPromise.then(function (data) {
                // On success, set the projects results
                vm.results = data.results;
                showProjectsOnMap_();
            }, function(){
                // On error
                vm.results = [];
                showProjectsOnMap_();
            });
        }

        /**
         * Set the mapper level
         * @param level
         */
        vm.setMapperLevel = function(level){
            vm.mapperLevel = level;
        };

        /**
         * Search projects
         */
        vm.search = function(){
            searchProjects();
        };

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
         * TODO: similar code also lives in the profile controller, so maybe it could be moved to a service
         * @private
         */
        function showProjectsOnMap_(){

            vm.vectorSource.clear();

            // iterate over the projects and add the center of the project as a point on the map
            for (var i = 0; i < vm.results.length; i++){
                var projectCenter = ol.proj.transform(vm.results[i].aoiCentroid.coordinates, 'EPSG:4326', 'EPSG:3857');
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
