(function () {

    'use strict';

    /**
     * @fileoverview This file provides a show project aois directive.
     */

    angular
        .module('taskingManager')
        .controller('showProjectAoisController', ['$scope', 'mapService', 'searchService', 'geospatialService', 'styleService','projectMapService', showProjectAoisController])
        .directive('showProjectAois', showProjectAoisDirective);

    /**
     * Creates show-project-aois directive
     * Example:
     *
     * <show-project-aois your-projects='true'></show-project-aois>
     */
    function showProjectAoisDirective() {

        var directive = {
            restrict: 'EA',
            templateUrl: 'app/components/show-project-aois/showProjectAois.html',
            controller: 'showProjectAoisController',
            controllerAs: 'showProjectAoisCtrl',
            scope: {
                yourProjects: '='
            },
            bindToController: true // because the scope is isolated
        };

        return directive;
    }

    function showProjectAoisController($scope, mapService, searchService, geospatialService, styleService, projectMapService) {

        var vm = this;
        vm.otherProjectVectorLayer = null;
        vm.otherProjectMaxResolution = 1250
        vm.currentResolution = 0;
        vm.errorLoadingExistingProjects = false;
        
        activate();
        
        function activate(){
            vm.map = mapService.getOSMMap();
        }

        // Watches the isSelectAreaActive variable and deactivates the drawtools if set false
        $scope.$watch('showProjectAoisCtrl.yourProjects', function(yourProjects) {
            vm.yourProjects = yourProjects;
            addOtherProjectsLayer();
            projectMapService.initialise(vm.map);
            var hoverIdentify = false;
            var clickIdentify = true;
            projectMapService.addPopupOverlay(hoverIdentify, clickIdentify);
            vm.currentResolution = vm.map.getView().getResolution();
        });
        
        /**
         * Add a layer that shows the AOIs of other projects
         */
        function addOtherProjectsLayer(){
            var vectorSource = new ol.source.Vector({
                loader: function(extent){
                    vm.errorLoadingExistingProjects = false;
                    vectorSource.clear();
                    var params = {
                        bbox: geospatialService.transformExtentToLatLonString(extent),
                        createdByMe: vm.yourProjects
                    };
                    var resultsPromise = searchService.getProjectsWithinBBOX(params);
                    resultsPromise.then(function (data) {
                        var features = geospatialService.getFeaturesFromGeoJSON(data);
                        vectorSource.addFeatures(features);
                    }, function () {
                        vm.errorLoadingExistingProjects = true;
                    });
                },
                strategy: ol.loadingstrategy.bbox
            });
            vm.otherProjectVectorLayer = new ol.layer.Vector({
                source: vectorSource,
                style: function(feature){
                    var status = feature.getProperties().projectStatus;
                    if (status === 'DRAFT'){
                        return styleService.getStyleWithColour("blue");
                    }
                    else if (status === 'PUBLISHED'){
                        return styleService.getStyleWithColour("red");
                    }
                    else if (status === 'ARCHIVED'){
                        return styleService.getStyleWithColour("black");
                    }
                    else {
                        return styleService.getStyleWithColour("black");
                    }
                },
                maxResolution: vm.otherProjectMaxResolution
            });
            vm.otherProjectVectorLayer.setZIndex(50);
            vm.map.addLayer(vm.otherProjectVectorLayer);
            vm.otherProjectVectorLayer.setVisible(false);

            // Update the resolution after moveend
            vm.map.on('moveend', function(){
                vm.errorLoadingExistingProjects = true;
                console.log(vm.map.getView().getResolution());
                vm.currentResolution = vm.map.getView().getResolution();
                $scope.$apply();
            })
        }

        /**
         * Toggle the layer with other project AOIs
         */
        vm.toggleOtherProjectAreasLayer = function(){
            if (vm.otherProjectVectorLayer.getVisible()){
                vm.otherProjectVectorLayer.setVisible(false);
                projectMapService.closePopup();
            }
            else {
                vm.otherProjectVectorLayer.setVisible(true);
            }
        };
    }
})();