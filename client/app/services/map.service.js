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
            addTiledWMSLayer: addTiledWMSLayer,
            addBingLayer: addBingLayer,
            addGeocoder: addGeocoder,
            addOverviewMap: addOverviewMap
        };

        return service;

        /**
         * Create an OpenLayers OSM map
         * with additional layers. 
         * Supported additional layers:
         *    - XYZ
         *    - WMS
         *    - Bing
         * @param targetElement
         * @param disableScroll - optional - defaults to false
         */
        function createOSMMap(targetElement, disableScrollZoom){
            var scaleLineControl = new ol.control.ScaleLine();
            var attribution = new ol.control.Attribution({
                collapsible: false
            });

            map = new ol.Map({
                layers: [
                    new ol.layer.Tile({
                        source: new ol.source.OSM({
                            url: "//{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
                            attributions: "<a href='http://www.openstreetmap.org/copyright/' target='_blank'>© OpenStreetMap</a> contributors"
                        }),
                        title: 'OpenStreetMap',
                        type: 'base'
                    })
                ],
                controls: ol.control.defaults({attribution: false}).extend([attribution]),
                target: targetElement,
                view: new ol.View({
                    center: [0, 0],
                    zoom: 2
                })
            });

            // Disable scroll
            if (disableScrollZoom){
                map.getInteractions().forEach(function(interaction) {
                    if (interaction instanceof ol.interaction.MouseWheelZoom) {
                    interaction.setActive(false);
                  }
                }, this);
            }

            map.addControl(scaleLineControl);

            // Add additional layers defined in the config
            var additionalLayers = configService.layers;
            if (additionalLayers) {
                for (var i = 0; i < additionalLayers.length; i++) {
                    if (additionalLayers[i].type === 'XYZ') {
                        addXYZLayer(additionalLayers[i].name, additionalLayers[i].url, additionalLayers[i].attribution);
                    }
                    if (additionalLayers[i].type === 'WMS'){
                        addTiledWMSLayer(additionalLayers[i].name, additionalLayers[i].url, additionalLayers[i].layerName, additionalLayers[i].attribution)
                    }
                    if (additionalLayers[i].type === 'bing'){
                        addBingLayer(additionalLayers[i].name, additionalLayers[i].key, additionalLayers[i].imagerySet, additionalLayers[i].attribution)
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
         * Adds an overview map to the map and restrict the resolution to the maximum resolution of the main map
         */
        function addOverviewMap(){
            var restrictedResolution = map.getView().getMaxResolution();
            var overviewMapControl = new ol.control.OverviewMap({
                className: 'ol-overviewmap ol-custom-overviewmap',
                view: new ol.View({
                    resolutions: [restrictedResolution]
                })
            });
            map.addControl(overviewMapControl);
        }

        /**
         * Adds a XYZ layer to the map
         */
        function addXYZLayer(name, url, attribution, visible){
            var visibility = false;
            if (visible){
                visibility = true;
            }
            var source = new ol.source.XYZ({
                url: url
            });
            if (attribution){
                source.setAttributions(attribution);
            }
            var aerialLayer = new ol.layer.Tile({
                visible: visibility,
                preload: Infinity,
                title: name,
                type: 'base',
                source: source
            });
            map.addLayer(aerialLayer);
        }

        /**
         * Add tiled WMS layer
         * @param name
         * @param url
         * @param layer
         * @param attribution
         * @param visible
         */
        function addTiledWMSLayer(name, url, layer, attribution, visible){
            var visibility = false;
            if (visible){
                visibility = true;
            }
            var source = new ol.source.TileWMS({
                url: url,
                params: {
                    'LAYERS': layer
                }
            });
            if (attribution){
                source.setAttributions(attribution);
            }
            var wmsLayer = new ol.layer.Tile({
                visible: visibility,
                title: name,
                type: 'base',
                source: source
            });
            map.addLayer(wmsLayer);
        }
        
        
        /**
         * Add bing WMS layer
         * @param name
         * @param key
         * @param imagerySet
         * @param attribution
         * @param visible
         */
        function addBingLayer(name, key, imagerySet, attribution, visible){
            var visibility = false;
            if (visible){
                visibility = true;
            }
            var source = new ol.source.BingMaps({
              key: key,
              imagerySet: imagerySet,
            })
            if (attribution){
                source.setAttributions(attribution);
            }
            var bingLayer = new ol.layer.Tile({
                preload: Infinity,
                visible: visibility,
                title: name,
                type: 'base',
                source: source
            });
            map.addLayer(bingLayer);
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