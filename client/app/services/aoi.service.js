(function () {
    'use strict';
    /**
     * @fileoverview This file provides a AOI service using OpenLayers to draw an AOI or add features as an AOI.
     * This service depends on an OL map to be defined
     */

    angular
        .module('taskingManager')
        .service('aoiService', ['mapService', aoiService]);

    function aoiService(mapService) {

        var map = null;
        var drawToolsDefined = false;
        var drawPolygon = null;
        var source = null;
        var features = null;
        var modify = null;

        var service = {
            initDrawTools: initDrawTools,
            getDrawPolygonActive: getDrawPolygonActive,
            setDrawPolygonActive: setDrawPolygonActive,
            removeAllFeatures: removeAllFeatures,
            getFeatures: getFeatures,
            setFeatures: setFeatures,
            zoomToExtent: zoomToExtent
        };

        return service;

        /**
         * Initialise the draw tools
         */
        function initDrawTools() {
            if (!drawToolsDefined) {
                features = new ol.Collection();
                map = mapService.getOSMMap();
                addVectorLayer();
                initDrawPolygonInteraction();
                initModifyInteraction();
                drawToolsDefined = true;
            }
        }

        /**
         * Adds a vector layer to the map which is needed for the draw tool
         */
        function addVectorLayer(){
            source = new ol.source.Vector({features: features});
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
         * Initialises the modify interaction which allows users to change a drawn shape
         */
        function initModifyInteraction() {
            modify = new ol.interaction.Modify({
                features: features,
                // the SHIFT key must be pressed to delete vertices, so
                // that new vertices can be drawn at the same position
                // of existing vertices
                deleteCondition: function (event) {
                    return ol.events.condition.shiftKeyOnly(event) &&
                        ol.events.condition.singleClick(event);
                }
            });
            map.addInteraction(modify);
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
            modify.setActive(boolean);
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
         * Sets the AOI features by adding it to the soruce
         * @param aoiFeatures
         */
        function setFeatures(aoiFeatures){
            source.addFeatures(aoiFeatures);
        }

        /**
         * Zoom to the OpenLayers draw source's extent
         */
        function zoomToExtent(){
            map.getView().fit(source.getExtent());
        }
    }
})();