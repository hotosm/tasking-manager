(function () {
    'use strict';
    /**
     * @fileoverview This file provides a draw service using OpenLayers.
     * This service depends on an OL map to be defined
     */

    angular
        .module('taskingManager')
        .service('drawService', ['mapService','projectService', drawService]);

    function drawService(mapService) {

        var map = null;
        var drawToolsDefined = false;
        var drawPolygon = null;
        var source = null;

        var service = {
            initDrawTools: initDrawTools,
            getDrawPolygonActive: getDrawPolygonActive,
            setDrawPolygonActive: setDrawPolygonActive,
            removeAllFeatures: removeAllFeatures,
            getFeatures: getFeatures,
            zoomToExtent: zoomToExtent
        };

        return service;

        /**
         * Initialise the draw tools
         */
        function initDrawTools() {
            if (!drawToolsDefined) {
                map = mapService.getOSMMap();
                addVectorLayer();
                initDrawPolygonInteraction();
                drawToolsDefined = true;
            }
        }

        /**
         * Adds a vector layer to the map which is needed for the draw tool
         */
        function addVectorLayer(){
            source = new ol.source.Vector();
            var vector = new ol.layer.Vector({
                source: source
            });
            map.addLayer(vector);
        }

        /**
         * Initialises the OpenLayers draw interactions - default to inactive
         */
        function initDrawPolygonInteraction() {
            // Draw interactions - Polygon
            drawPolygon = new ol.interaction.Draw({
                source: source,
                type: "MultiPolygon"
            });
            drawPolygon.setActive(false);
            map.addInteraction(drawPolygon);

            drawPolygon.on('drawstart', function(){
                removeAllFeatures();
            });
        }

        /**
         * Get the draw polygon interaction
         * @returns {*|null|ol.interaction.Draw}
         */
        function getDrawPolygonActive() {
            return drawPolygon.getActive();
        }

        /**
         * Sets the drawing OpenLayers interaction (tools for drawing) to active/inactive
         */
        function setDrawPolygonActive(boolean){
            drawPolygon.setActive(boolean);
        }

        /**
         * Removes all the features from the OpenLayers map by removing all the features from the source
         */
        function removeAllFeatures() {
            source.clear();
        }

        /**
         * Return the features on the source
         * @returns {*|ol.Collection.<ol.Feature>|Array.<ol.Feature>}
         */
        function getFeatures(){
            return source.getFeatures();
        }

        /**
         * Zoom to the OpenLayers draw source's extent
         */
        function zoomToExtent(){
            map.getView().fit(source.getExtent());
        }
    }
})();