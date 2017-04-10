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

        // a default style is good practice!
        var DEAFAULT_STYLE = new ol.style.Style({
            fill: new ol.style.Fill({
                color: [250, 250, 250, 1]
            }),
            stroke: new ol.style.Stroke({
                color: [220, 220, 220, 1],
                width: 1
            })
        });

        var FILL_COLOUR_READY = [223, 223, 223, 0.1];//very light grey, 0.1 opacity
        var FILL_COLOUR_INVALIDATED = [255, 0, 0, 0.4];//red, 0.4 opacity
        var FILL_COLOUR_MAPPED = [255, 165, 0, 0.4];//orange, 0.4 opacity
        var FILL_COLOUR_VALIDATED = [0, 128, 0, 0.4];//green, 0.4 opacity
        var FILL_COLOUR_LOCKED = [30, 144, 255, 0.4];//blue, 0.4 opacity
        var FILL_COLOUR_BADIMAGERY = [0, 0, 0, 0.4];//black, 0.4 opacity

        var STROKE_COLOUR = [84, 84, 84, 0.7];//grey, 0.7 opacity
        var STROKE_WIDTH = 1;

        var STROKE_COLOUR_SELECTED = [255, 255, 0, 1]//red, 1.0 opacity
        var STROKE_WIDTH_SELECTED = 2;

        // TODO - It could be important for performance to cache styles.
        // This could work with a javascript object literal to cache previously created styles.
        // The get style functions could check the cache for the style and if found return it, otherwise
        // create a new one and add to cache
        // var styleCache = {};

        var service = {
            getTaskStyle: getTaskStyle,
            getSelectedTaskStyle: getSelectedTaskStyle,
            getHighlightedTaskStyle: getHighlightedTaskStyle,
            getProjectStyle: getProjectStyle,
            getHighlightedProjectStyle: getHighlightedProjectStyle
        };

        return service;

        /**
         * OpenLayers style function.  Creates a Style for tasks based on the feature's taskStatus property.
         * @param feature - feature to be styled
         * @returns {ol.style.Style}
         */
        function getTaskStyle(feature) {

            // Get the feature's properties that control styling
            var status = feature.get('taskStatus');

            // calculate the fill colour and opacity settings based on status, use rgba because this is the way to
            // set opacity in OL3, but also better for cross browser than named colors
            var fillColor = null;
            if (status === 'LOCKED_FOR_MAPPING' || status === 'LOCKED_FOR_VALIDATION') {
                fillColor = FILL_COLOUR_LOCKED;
            }
            else if (status === 'READY') {
                fillColor = FILL_COLOUR_READY;
            }
            else if (status === 'INVALIDATED') {
                fillColor = FILL_COLOUR_INVALIDATED
            }
            else if (status === 'MAPPED') {
                fillColor = FILL_COLOUR_MAPPED
            }
            else if (status === 'VALIDATED') {
                fillColor = FILL_COLOUR_VALIDATED
            }
            else if (status === 'BADIMAGERY') {
                fillColor = FILL_COLOUR_BADIMAGERY
            }
            else {
                return DEAFAULT_STYLE;
            }

            return new ol.style.Style({
                fill: new ol.style.Fill({
                    color: fillColor
                }),
                stroke: new ol.style.Stroke({
                    color: STROKE_COLOUR,
                    width: STROKE_WIDTH
                })
            });
        }

        /**
         * OpenLayers style function.  Creates a features on the highlight layer.
         * @param feature - feature to be styled
         * @returns {ol.style.Style}
         */
        function getHighlightedTaskStyle() {
            return new ol.style.Style({
                fill: new ol.style.Fill({
                    color: [225, 225, 225, 0]
                }),
                stroke: new ol.style.Stroke({
                    color: [0, 0, 0, 1],
                    width: 4
                })
            });
        }

        /**
         * OpenLayers style function.  Creates a style for currently selected tasks.
         * @param feature - feature to be styled
         * @returns {ol.style.Style}
         */
        function getSelectedTaskStyle(feature) {
            // get the base style for the feature and override it's stroke only.
            var baseStyle = getTaskStyle(feature);
            baseStyle.getStroke().setColor(STROKE_COLOUR_SELECTED);
            baseStyle.getStroke().setWidth(STROKE_WIDTH_SELECTED);
            return baseStyle;
        }

        /**
         * OpenLayers style function for showing a project (point) on the map
         * @returns {ol.style.Style}
         */
        function getProjectStyle(){
            var fill = new ol.style.Fill({
                color: [255, 0, 0, 0.5], // red
                width: 1
            });
            var stroke = new ol.style.Stroke({
                color: [255, 0, 0, 1], // red
                width: 1
            });
            var style = new ol.style.Style({
                image: new ol.style.Circle({
                    fill: fill,
                    stroke: stroke,
                    radius: 5
                })
            });
            return style;
        }

        /**
         * OpenLayers style function for highlighting a project (point) on the map
         * @returns {ol.style.Style}
         */
        function getHighlightedProjectStyle(){
            var fill = new ol.style.Fill({
                color: [255, 0, 0, 1], // red
                width: 1
            });
            var stroke = new ol.style.Stroke({
                color: [255, 0, 0, 1], // red
                width: 1
            });
            var highlightStyle = new ol.style.Style({
                image: new ol.style.Circle({
                    fill: fill,
                    stroke: stroke,
                    radius: 8
                })
            });
            return highlightStyle;
        }
    }
})();
