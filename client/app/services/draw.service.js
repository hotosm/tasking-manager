(function () {
    'use strict';
    /**
     * @fileoverview This file provides a draw service using OpenLayers
     * This service depends on an OL map to be defined
     * No event handlers are added here to keep the service focused. Instead it returns the interactions so that
     * the controllers using this service can handle the events on the interactions themselves.
     */

    angular
        .module('taskingManager')
        .service('drawService', ['mapService', drawService]);

    function drawService(mapService) {

        var source = null;
        var vectorLayer = null;
        var map = null;
        var features = null;

        // Interactions
        var drawPolygonInteraction = null;
        var drawRectangleInteraction = null;
        var drawCircleInteraction = null;
        var selectInteraction = null;
        var modifyInteraction = null;
        var translateInteraction = null;

        var service = {
            initInteractions: initInteractions,
            getDrawPolygonInteraction: getDrawPolygonInteraction,
            getDrawRectangleInteraction: getDrawRectangleInteraction,
            getDrawCircleInteraction: getDrawCircleInteraction,
            getModifyInteraction: getModifyInteraction,
            getSelectInteraction: getSelectInteraction,
            getTranslateInteraction: getTranslateInteraction,
            getSource: getSource
        };

        return service;

        /**
         * Initialise the draw tools
         * @param addPolygon
         * @param addRectangle
         * @param addCircle
         * @param addSelect
         * @param addTranslate
         * @param addModify
         */
        function initInteractions(addPolygon, addRectangle, addCircle, addSelect, addTranslate, addModify) {
            map = mapService.getOSMMap();
            features = new ol.Collection();

            addVectorLayer();
            if (addPolygon) {
                initDrawPolygonInteraction_();
            }
            if (addRectangle) {
                initDrawRectangleInteraction_();
            }
            if (addCircle) {
                initDrawCircleInteraction_();
            }
            if (addSelect) {
                initSelectInteraction_();
            }
            if (addTranslate) {
                initTranslateInteraction_();
            }
            if (addModify) {
                initModifyInteraction_();
            }
        }

        /**
         * Adds a vector layer to the map which is needed for the draw tool
         */
        function addVectorLayer(){
            source = new ol.source.Vector({features: features});
            vectorLayer = new ol.layer.Vector({
                source: source
            });
            // Use a high Z index to ensure it draws on top of other layers
            vectorLayer.setZIndex(100);
            map.addLayer(vectorLayer);
        }

        /**
         * Initialises the draw interaction for drawing polygons
         * @private
         */
        function initDrawPolygonInteraction_() {
            drawPolygonInteraction = new ol.interaction.Draw({
                type: "MultiPolygon",
                source: source
            });
            drawPolygonInteraction.setActive(false);
            map.addInteraction(drawPolygonInteraction);
        }


        /**
         * Returns the draw polygon interaction
         * @returns {*}
         */
        function getDrawPolygonInteraction() {
            return drawPolygonInteraction;
        }

        /**
         * Initialises the draw interaction for drawing rectangles
         * @private
         */
        function initDrawRectangleInteraction_(){
            drawRectangleInteraction = new ol.interaction.Draw({
                type: "Circle",
                source: source,
                geometryFunction: ol.interaction.Draw.createBox()
            });
            drawRectangleInteraction.setActive(false);
            map.addInteraction(drawRectangleInteraction);
        }

        /**
         * Returns the draw rectangle interaction
         * @returns {*}
         */
        function getDrawRectangleInteraction(){
            return drawRectangleInteraction;
        }

        /**
         * Initialises the draw interaction for drawing circles
         * @private
         */
        function initDrawCircleInteraction_(){
            drawCircleInteraction = new ol.interaction.Draw({
                type: "Circle",
                source: source,
                geometryFunction: ol.interaction.Draw.createRegularPolygon()
            });
            drawCircleInteraction.setActive(false);
            map.addInteraction(drawCircleInteraction);
        }

        /**
         * Returns the draw circle interaction
         * @returns {*}
         */
        function getDrawCircleInteraction(){
            return drawCircleInteraction;
        }

        /**
         * Initialises the modify interaction which allows users to change a drawn shape
         * It allows modifying the selected feature so it needs the select interaction to be active.
         * TODO: check if there is any progress on modifying circles and rectangles:
         * https://github.com/openlayers/openlayers/issues/5095
         * @private
         */
        function initModifyInteraction_() {
            var modifyFeatures = features;
            // If a select interaction is defined, use the selected features for modification, otherwise use the 
            // vector's source's features
            if (selectInteraction){
                modifyFeatures = selectInteraction.getFeatures();
            }
            modifyInteraction = new ol.interaction.Modify({
                features: modifyFeatures,
                // the SHIFT key must be pressed to delete vertices, so
                // that new vertices can be drawn at the same position
                // of existing vertices
                deleteCondition: function (event) {
                    return ol.events.condition.shiftKeyOnly(event) &&
                        ol.events.condition.singleClick(event);
                }
            });
            map.addInteraction(modifyInteraction);
        }

        /**
         * Returns the modify interaction
         * @returns {*}
         */
        function getModifyInteraction(){
            return modifyInteraction;
        }

        /**
         * Initialises the select interaction which can be used for deleting features etc.
         * @private
         */
        function initSelectInteraction_(){
            selectInteraction = new ol.interaction.Select({
                layers: [vectorLayer]
            });
            map.addInteraction(selectInteraction);
        }

        /**
         * Returns the select interaction
         * @returns {*}
         */
        function getSelectInteraction(){
            return selectInteraction;
        }

        /**
         * Initialise the translate interaction - which is used for moving features
         * It allows moving the selected feature so it needs the select interaction to be active.
         * @private
         */
        function initTranslateInteraction_(){
            translateInteraction = new ol.interaction.Translate({
                features: selectInteraction.getFeatures()
            });
            map.addInteraction(translateInteraction);
        }

        /**
         * Return the translate interaction - which is used for moving features
         * @returns {*}
         */
        function getTranslateInteraction(){
            return translateInteraction;
        }

        /**
         * Return the source
         * @returns {*}
         */
        function getSource(){
            return source;
        }
    }
})();