(function () {
    'use strict';

    angular
        .module('taskingManager')
        .service('mapService', [mapService]);

    /**
     * @fileoverview This file provides a map service.
     * It creates an OpenLayers map
     */
    function mapService() {

        var map = null;

        var service = {
            createOSMMap: createOSMMap,
            getOSMMap: getOSMMap
        };

        return service;

        /**
         * Create an OpenLayers OSM map
         * @param targetElement
         */
        function createOSMMap(targetElement){
            map = new ol.Map({
                layers: [
                    new ol.layer.Tile({
                        source: new ol.source.OSM()
                    })
                ],
                target: targetElement,
                view: new ol.View({
                    center: [0, 0],
                    zoom: 2
                })
            });
        }

        /**
         * Return the current OSM map
         * @returns {*}
         */
        function getOSMMap(){
            return map;
        }
    }
})();