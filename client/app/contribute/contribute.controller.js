(function () {

    'use strict';

    /**
     * Contribute controller which manages contributing to a project
     */
    angular
        .module('taskingManager')
        .controller('contributeController', ['mapService', 'searchService', 'projectMapService', contributeController]);

    function contributeController(mapService, searchService, projectMapService) {

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
        vm.searchRoads = false;
        vm.searchBuildings = false;
        vm.searchWaterways = false;
        vm.searchLanduse = false;
        vm.searchOther = false;

        activate();

        function activate() {
            mapService.createOSMMap('map');
            vm.map = mapService.getOSMMap();
            projectMapService.initialise(vm.map);
            searchProjects(); 
        }

        /**
         * Search projects with search parameters
         */
        function searchProjects(){
            vm.mappingTypes = [];
            if (vm.searchRoads){
                vm.mappingTypes.push("ROADS");
            }
            if (vm.searchBuildings){
                vm.mappingTypes.push("BUILDINGS");
            }
            if (vm.searchWaterways){
                vm.mappingTypes.push("WATERWAYS");
            }
            if (vm.searchLanduse){
                vm.mappingTypes.push("LANDUSE");
            }
            if (vm.searchOther){
                vm.mappingTypes.push("OTHER");
            }
            var resultsPromise = searchService.searchProjects(
                vm.mapperLevel,
                vm.mappingTypes
            );
            resultsPromise.then(function (data) {
                // On success, set the projects results
                vm.results = data.results;
                projectMapService.showProjectsOnMap(vm.results);
            }, function(){
                // On error
                vm.results = [];
                projectMapService.showProjectsOnMap(vm.results);
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
    }
})();
