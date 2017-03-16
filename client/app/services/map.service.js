(function () {
    'use strict';

    angular
        .module('taskingManager')
        .service('mapService', ['configService', mapService]);

    /**
     * @fileoverview This file provides a map service.
     * It creates an OpenLayers map
     */
    function mapService(configService) {

        var map = null;

        var service = {
            createOSMMap: createOSMMap,
            getOSMMap: getOSMMap,
            addXYZLayer: addXYZLayer,
            addGeocoder: addGeocoder
        };

        return service;

        /**
         * Create an OpenLayers OSM map
         * with additional layers. 
         * Supported additional layers:
         *    - XYZ
         * @param targetElement
         */
        function createOSMMap(targetElement){
            var scaleLineControl = new ol.control.ScaleLine();

            map = new ol.Map({
                layers: [
                    new ol.layer.Tile({
                        source: new ol.source.OSM(),
                        title: 'OpenStreetMap',
                        type: 'base'
                    })
                ],
                target: targetElement,
                view: new ol.View({
                    center: [0, 0],
                    zoom: 2
                })
            });
            
            map.addControl(scaleLineControl);

            // Add additional layers defined in the config
            var additionalLayers = configService.layers;
            if (additionalLayers) {
                for (var i = 0; i < additionalLayers.length; i++) {
                    if (additionalLayers[i].type === 'XYZ') {
                        addXYZLayer(additionalLayers[i].name, additionalLayers[i].url);
                    }
                }
            }
            addLayerSwitcherControl_();
        }

        /**
         * Return the current OSM map
         * @returns {*}
         */
        function getOSMMap(){
            return map;
        }

        /**
         * Adds a layer switcher control to the map
         * Uses Matt Walker's OpenLayers LayerSwitcher extension
         * https://github.com/walkermatt/ol3-layerswitcher
         * Each layer to be displayed in the layer switcher needs to have a title property.
         * Each base map layer needs to have a type: 'base' property.
         */
        function addLayerSwitcherControl_(){
            var layerSwitcher = new ol.control.LayerSwitcher();
            map.addControl(layerSwitcher);
        }

        /**
         * Adds a XYZ layer to the map
         */
        function addXYZLayer(name, url, visible){
            var visibility = false;
            if (visible){
                visibility = true;
            }
            var aerialLayer = new ol.layer.Tile({
                visible: visibility,
                preload: Infinity,
                title: name,
                type: 'base',
                source: new ol.source.XYZ({
                    url: url
                })
            });
            map.addLayer(aerialLayer);
        }
        
        /**
         * Adds a geocoder control to the map
         * It is using an OpenLayers plugin control
         * For more info and options, please see https://github.com/jonataswalker/ol3-geocoder
         * @private
         */
        function addGeocoder(){

            // Initialise the geocoder
            var geocoder = new Geocoder('nominatim', {
                provider: 'osm',
                lang: 'en',
                placeholder: 'Search for ...',
                targetType: 'glass-button',
                limit: 5,
                keepOpen: true,
                preventDefault: true
            });
            map.addControl(geocoder);

            // By setting the preventDefault to false when initialising the Geocoder, you can add your own event
            // handler which has been done here.
            geocoder.on('addresschosen', function(evt){
                map.getView().setCenter(evt.coordinate);
                // It is assumed that most people will search for cities. Zoom level 12 seems most appropriate
                map.getView().setZoom(12);
            });
        }
    }
})();