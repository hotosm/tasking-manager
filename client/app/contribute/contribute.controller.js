(function () {

    'use strict';

    /**
     * Contribute controller which manages contributing to a project
     */
    angular
        .module('taskingManager')
        .controller('contributeController', ['$scope', '$location', '$document', 'mapService', 'searchService', 'projectMapService', 'tagService', 'languageService', contributeController]);

    function contributeController($scope, $location, $document, mapService, searchService, projectMapService, tagService, languageService) {

        var vm = this;

        vm.results = [];
        vm.vectorSource = null;

        // Default to grid view
        vm.resultsView = 'grid';

        // Tags
        vm.organisations = [];
        vm.campaigns = [];

        // Search parameters
        vm.mapperLevel = 'ALL'; // default to ALL
        vm.searchRoads = false;
        vm.searchBuildings = false;
        vm.searchWaterways = false;
        vm.searchLanduse = false;
        vm.searchOther = false;
        vm.searchOrganisation = '';
        vm.searchCampaign = '';
        vm.searchText = '';

        // Paging
        vm.currentPage = 1;
        vm.pagination = null;

        // Types of mapping dropdown
        vm.showDropdown = false;

        //map legend
        vm.showVectorLegend = false;
        vm.showClusterLegend = true;
        var CLUSTER_THRESHOLD_RESOLUTION = 4891.96981025128;

        // Watch the languageService for change in language and search again when needed
        $scope.$watch(function () {
            return languageService.getLanguageCode();
        }, function () {
            getURLParams();
            searchProjects(vm.currentPage);
        }, true);

        activate();

        function activate() {
            var disableScrollZoom = false;
            mapService.createOSMMap('map', disableScrollZoom);
            vm.map = mapService.getOSMMap();
            projectMapService.initialise(vm.map, CLUSTER_THRESHOLD_RESOLUTION);
            vm.map.on('moveend', function () {
                vm.showVectorLegend = vm.map.getView().getResolution() < CLUSTER_THRESHOLD_RESOLUTION;
                vm.showClusterLegend = vm.map.getView().getResolution() >= CLUSTER_THRESHOLD_RESOLUTION;
                $scope.$apply();
            });
            var hoverIdentify = false;
            var clickIdentify = true;
            projectMapService.addPopupOverlay(hoverIdentify, clickIdentify);
            setOrganisationTags();
            setCampaignTags();
        }

        /**
         * Search projects with search parameters
         * @param page
         */
        function searchProjects(page) {
            vm.mappingTypes = [];
            if (vm.searchRoads) {
                vm.mappingTypes.push("ROADS");
            }
            if (vm.searchBuildings) {
                vm.mappingTypes.push("BUILDINGS");
            }
            if (vm.searchWaterways) {
                vm.mappingTypes.push("WATERWAYS");
            }
            if (vm.searchLanduse) {
                vm.mappingTypes.push("LANDUSE");
            }
            if (vm.searchOther) {
                vm.mappingTypes.push("OTHER");
            }

            var searchParams = {};

            // Only add parameters if set
            if (vm.mapperLevel) {
                searchParams.mapperLevel = vm.mapperLevel;
            }
            if (vm.mappingTypes.length > 0) {
                searchParams.mappingTypes = '';
                for (var i = 0; i < vm.mappingTypes.length; i++) {
                    searchParams.mappingTypes += vm.mappingTypes[i];
                    if (i < vm.mappingTypes.length - 1) {
                        searchParams.mappingTypes += ',';
                    }
                }
            }
            if (vm.searchOrganisation) {
                searchParams.organisationTag = vm.searchOrganisation;
            }
            if (vm.searchCampaign) {
                searchParams.campaignTag = vm.searchCampaign;
            }
            if (vm.searchText) {
                searchParams.textSearch = vm.searchText;
            }
            if (page) {
                searchParams.page = page;
            }

            var resultsPromise = searchService.searchProjects(searchParams);
            resultsPromise.then(function (data) {
                // On success, set the projects results
                vm.results = data.results;
                vm.pagination = data.pagination;
                projectMapService.replaceFeatures(data.mapResults)
                setURLParams(searchParams);
            }, function () {
                // On error
                setURLParams(searchParams);
                vm.results = {};
                projectMapService.showProjectsOnMap(vm.results);
            });
        }

        /**
         * Search projects
         */
        vm.search = function (page) {
            searchProjects(page);
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
        function setCampaignTags() {
            var resultsPromise = tagService.getCampaignTags();
            resultsPromise.then(function (data) {
                // On success, set the projects results
                vm.campaigns = data.tags;
            }, function () {
                // On error
                vm.campaigns = [];
            });
        }

        /**
         * Set the URL parameters so users can bookmark/share the page with search params
         * @param searchParams
         */
        function setURLParams(searchParams) {
            $location.search('difficulty', searchParams.mapperLevel);
            $location.search('organisation', searchParams.organisationTag);
            $location.search('campaign', searchParams.campaignTag);
            $location.search('types', searchParams.mappingTypes);
            $location.search('page', searchParams.page);
            $location.search('text', searchParams.textSearch);
        }

        /**
         * Get the URL params for searching
         */
        function getURLParams() {
            vm.searchOrganisation = $location.search().organisation;
            vm.searchCampaign = $location.search().campaign;
            vm.currentPage = $location.search().page;
            vm.searchText = $location.search().text;
            var mappingTypes = $location.search().types;
            if (mappingTypes) {
                populateMappingTypes(mappingTypes);
            }
            // Only update the mapperLevel when it is set
            if ($location.search().difficulty) {
                vm.mapperLevel = $location.search().difficulty;
            }
        }

        /**
         * Extract the mapping types from a string
         * @param mappingTypes
         */
        function populateMappingTypes(mappingTypes) {
            var mappingTypesArray = mappingTypes.split(',');
            for (var i = 0; i < mappingTypesArray.length; i++) {
                if (mappingTypesArray[i] === 'ROADS') {
                    vm.searchRoads = true;
                }
                if (mappingTypesArray[i] === 'BUILDINGS') {
                    vm.searchBuildings = true;
                }
                if (mappingTypesArray[i] == 'WATERWAYS') {
                    vm.searchWaterways = true;
                }
                if (mappingTypesArray[i] === 'LANDUSE') {
                    vm.searchLanduse = true;
                }
                if (mappingTypesArray[i] === 'OTHER')
                    vm.searchOther = true;
            }
        }
    }
})();
