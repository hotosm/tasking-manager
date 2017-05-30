(function () {

    'use strict';

    /**
     * Contribute controller which manages contributing to a project
     */
    angular
        .module('taskingManager')
        .controller('contributeController', ['$scope', 'mapService', 'searchService', 'projectMapService', 'tagService', 'languageService','accountService', contributeController]);

    function contributeController($scope, mapService, searchService, projectMapService, tagService, languageService, accountService) {

        var vm = this;

        vm.results = [];
        vm.vectorSource = null;

        // Paging results
        vm.itemsPerPage = 4;
        vm.currentPage = 1;

        // Default to grid view
        vm.resultsView = 'grid';

        // Tags
        vm.organisations = [];
        vm.campaigns = [];

        // Search parameters
        vm.mapperLevel = ''; // default to ALL
        vm.searchRoads = false;
        vm.searchBuildings = false;
        vm.searchWaterways = false;
        vm.searchLanduse = false;
        vm.searchOther = false;
        vm.searchOrganisation = '';
        vm.searchCampaign = '';
        vm.searchText = '';

        // Paging
        vm.pagination = null;
        
        // Character limit
        vm.characterLimitShortDescription = 100;

        // Watch the languageService for change in language and search again when needed
        $scope.$watch(function () { return languageService.getLanguageCode();}, function () {
            searchProjects();
        }, true);

        // Watch the accountService for change in account
        $scope.$watch(function () { return accountService.getAccount();}, function (account) {
            if (account) {
                // Set the default mapping level to the user's mapping level
                vm.mapperLevel = account.mappingLevel;
            }
            searchProjects();
        }, true);

        activate();

        function activate() {
            var disableScrollZoom = true;
            mapService.createOSMMap('map', disableScrollZoom);
            vm.map = mapService.getOSMMap();
            projectMapService.initialise(vm.map);
            projectMapService.addPopupOverlay();
            setOrganisationTags();
            setCampaignTags();
        }

        /**
         * Search projects with page param
         * @param page
         */
        vm.searchProjectsWithPage = function(page){
            searchProjects(page);
        };

        /**
         * Search projects with search parameters
         * @param page
         */
        function searchProjects(page){

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

            var searchParams = {};

            // Only add parameters if set
            if (vm.mapperLevel){
                searchParams.mapperLevel = vm.mapperLevel;
            }
            if (vm.mappingTypes.length > 0){
                searchParams.mappingTypes = '';
                for (var i = 0; i < vm.mappingTypes.length; i++){
                    searchParams.mappingTypes += vm.mappingTypes[i];
                    if (i < vm.mappingTypes.length - 1){
                        searchParams.mappingTypes += ',';
                    }
                }
            }
            if (vm.searchOrganisation){
                searchParams.organisationTag = vm.searchOrganisation;
            }
            if (vm.searchCampaign){
                searchParams.campaignTag = vm.searchCampaign;
            }
            if (vm.searchText){
                searchParams.textSearch = vm.searchText;
            }
            if (page){
                searchParams.page = page;
            }
           
            var resultsPromise = searchService.searchProjects(searchParams);
            resultsPromise.then(function (data) {
                // On success, set the projects results
                vm.results = data.results;
                vm.pagination = data.pagination;
                // First remove all projects from the map before adding the results
                projectMapService.removeProjectsOnMap();
                for (var i = 0; i < vm.results.length; i++){
                    if (vm.results[i].priority === 'URGENT'){
                        projectMapService.showProjectOnMap(vm.results[i], vm.results[i].aoiCentroid, "red", false);
                    }
                    else if (vm.results[i].priority === 'HIGH'){
                        projectMapService.showProjectOnMap(vm.results[i], vm.results[i].aoiCentroid, "orange", false);
                    }
                    else if (vm.results[i].priority === 'MEDIUM'){
                        projectMapService.showProjectOnMap(vm.results[i], vm.results[i].aoiCentroid, "yellow", false);
                    }
                    else if (vm.results[i].priority === 'LOW'){
                        projectMapService.showProjectOnMap(vm.results[i], vm.results[i].aoiCentroid, "blue", false);
                    }
                    else {
                        projectMapService.showProjectOnMap(vm.results[i], vm.results[i].aoiCentroid, "red", false);
                    }
                }

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
         * Set organisation tags
         */
        function setOrganisationTags() {
            var resultsPromise = tagService.getOrganisationTags();
            resultsPromise.then(function (data) {
                // On success, set the projects results
                vm.organisations = data.tags;
            }, function () {
                // On error
                vm.organisations = [];
            });
        }

        /**
         * Set campaign tags
         */
        function setCampaignTags(){
            var resultsPromise = tagService.getCampaignTags();
            resultsPromise.then(function (data) {
                // On success, set the projects results
                vm.campaigns = data.tags;
            }, function () {
                // On error
                vm.campaigns = [];
            });
        }
    }
})();
