(function () {
    'use strict';
    /**
     * @fileoverview This file provides a draw service using OpenLayers.
     * This service depends on an OL map to be defined
     */

    angular
        .module('taskingManager')
        .service('drawService', ['mapService', drawService]);

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
            getNumberOfFeatures: getNumberOfFeatures
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
                addDrawStartEventListeners();
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
                type: "Polygon"
            });
            drawPolygon.setActive(false);
            map.addInteraction(drawPolygon);
        }

        /**
         * Get the draw polygon interaction
         * @returns {*|null|ol.interaction.Draw}
         */
        function getDrawPolygonActive() {
            return drawPolygon.getActive();
        }

        /**
         * Removes all the features from the OpenLayers map by removing all the features from the source
         */
        function removeAllFeatures() {
            source.clear();
        }

        /**
         * Sets the drawing OpenLayers interaction (tools for drawing) to active/inactive
         */
        function setDrawPolygonActive(boolean){
            drawPolygon.setActive(boolean);
        }

        /**
         * Add event listeners to the draw interaction
         * They listen out for the drawstart event which gets fired when the user starts drawing a feature
         */
        function addDrawStartEventListeners(){
            drawPolygon.on('drawstart', function(){
                removeAllFeatures();
            });
        }

        /**
         * Get the number of features on the source
         * TODO: this might have to move to its own vector/source service when the import gets implemented
         * @returns {Number}
         */
        function getNumberOfFeatures(){
            return source.getFeatures().length;
        }
    }
})();