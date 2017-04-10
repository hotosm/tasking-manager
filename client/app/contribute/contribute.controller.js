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
            var resultsPromise = searchService.searchProjects(vm.mapperLevel);
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
