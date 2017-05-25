(function () {

    'use strict';

    /**
     * @fileoverview This file provides a add layer directive. 
     * Users can provide a URL and choose a type of layer/source which will then get added to the map
     * It depends on the mapService which provides the functionality to actually add the layer to the map
     */

    angular
        .module('taskingManager')
        .controller('addLayerController', ['mapService', addLayerController])
        .directive('addLayer', addLayerDirective);

    /**
     * Creates add-layer directive
     * Example:
     *
     * <add-layer></add-layer>
     */
    function addLayerDirective() {

        var directive = {
            restrict: 'EA',
            templateUrl: 'app/components/add-layer/add-layer.html',
            controller: 'addLayerController',
            controllerAs: 'addLayerCtrl',
            bindToController: true // because the scope is isolated
        };

        return directive;
    }

    function addLayerController(mapService) {

        var vm = this;
        vm.type = 'xyz';
        vm.layerURL = '';
        vm.layerName = '';
        vm.isVisible = false;
        
         /**
         * Add layer
         * Supported types: 
         *  - XYZ
         *  - WMS (tiled)
         * @param url
         */
        vm.addLayer = function(){
            if (vm.layerURL) {
                if (vm.type === 'xyz'){
                    // Use the type as the layer name
                    mapService.addXYZLayer(vm.type + ' (temporary)', vm.layerURL, true);
                }
                if (vm.type === 'wms'){
                    mapService.addTiledWMSLayer(vm.type + ' (temporary)', vm.layerURL, vm.layerName, true);
                }
            }
        };

        vm.toggleVisibility = function(){
            vm.isVisible = !vm.isVisible;
        }
    }
})();