(function () {
    'use strict';
    /**
     * @fileoverview This file provides a OpenLayers style service.
     * It provides styleFunctions which returns styles depending on feature attributes
     * StyleFunction docs can be found here: http://openlayers.org/en/latest/apidoc/ol.style.html#.StyleFunction
     *
     */

    angular
        .module('taskingManager')
        .service('styleService', [styleService]);

    function styleService() {

        var service = {
            getTaskStyleFunction: getTaskStyleFunction,
        };

        return service;

        /**
         * Creates a StyleFunction for tasks based on the feature's taskStatus and taskLocked properties.
         * @param feature
         * @returns {Array}
         */
        function getTaskStyleFunction(feature){

            var FILL_COLOUR_READY = 'rgba(223,223,223,0.1)';//very light gray, 0.1 opacity
            var FILL_COLOUR_INVALIDATED = 'rgba(84,84,84,0.4)';//grey, 0.4 opacity
            var FILL_COLOUR_DONE = 'rgba(255,165,0,0.4)';//orange, 0.4 opacity
            var FILL_COLOUR_VALIDATED = 'rgba(0,128,0,0.4)';//green, 0.4 opacity

            var STROKE_COLOUR_LOCKED = 'rgba(255,165,0,1)';//orange, 1.0 opacity
            var STROKE_COLOUR_UNLOCKED = 'rgba(84,84,84,0.7)';//grey, 0.7 opacity

            var STROKE_WIDTH_HEAVY = 2;
            var STROKE_WIDTH_LIGHT = 1;

            // Get the feature's properties that control styling
            var status = feature.get('taskStatus');
            var isLocked = feature.get('taskLocked');

            // calculate the fill colour and opacity settings based on status, use rgba because this is the way to
            // set opacity in OL3, but also better for cross browser than named colors
            var fillColor = null;
            if (status === 'READY') {
                fillColor  = FILL_COLOUR_READY;
            }
            else if (status === 'INVALIDATED') {
                fillColor = FILL_COLOUR_INVALIDATED
            }
            else  if (status === 'DONE') {
                fillColor = FILL_COLOUR_DONE
            }
            else  if (status === 'VALIDATED') {
                fillColor = FILL_COLOUR_VALIDATED
            }

            // calculate the outline colour, weight and opacity settings based on status, use rgba because
            // this is the way to set opacity in OL3, but also better for cross browser than named colors
            var outlineColor = typeof(isLocked) === "boolean" && isLocked ? STROKE_COLOUR_LOCKED : STROKE_COLOUR_UNLOCKED;
            var outlineWeight = typeof(isLocked) === "boolean"&& isLocked ? STROKE_WIDTH_HEAVY : STROKE_WIDTH_LIGHT;

            // build an ol.style.Style to be returned using calculated settings
            var style = new ol.style.Style({
                fill: new ol.style.Fill({
                    color: fillColor
                }),
                stroke: new ol.style.Stroke({
                  color: outlineColor,
                  width: outlineWeight
                })
            })

            return style;
        }
    }
})();
