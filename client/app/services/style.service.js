(function () {
    'use strict';
    /**
     * @fileoverview This file provides a OpenLayers style service.
     * It returns a styleFunction depending on the feature's attributes
     * StyleFunction docs can be found here: http://openlayers.org/en/latest/apidoc/ol.style.html#.StyleFunction
     *
     * The following properties are used for styling
     *  - type
     *  - selected
     *  - fill (in rgba)
     *  - stroke (in rgba)
     *  - strokeWidth
     *  - strokeStyle (dashed / dotted / none)
     *  - showLineArrows (true / false)
     *  - fontSize
     *  - fontWeight
     *  - labelRotation (in degrees)
     *  - labelText
     *  - pointSize
     *  - iconName
     *  - showMeasurement (true / false)
     *  - measureText
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
         * Creates a StyleFunction for tasks based on the feature's taskStatus and taskLocked properties
         * @param feature
         * @returns {Array}
         */
        function getTaskStyleFunction(feature){

            // Get the feature's properties that control styling
            var status = feature.get('taskStatus');
            var isLocked = feature.get('taskLocked');

            // calculate the fill colour and opacity settings based on status, use rgba because this is the way to
            // set opacity in OL3, but also better for cross browser than named colors
            var fillColor = null;
            if (status === 'READY') {
                fillColor  = 'rgba(223,223,223,0.1)';//very light gray, 0.1 opacity
            }
            else if (status === 'INVALIDATED') {
                fillColor  = 'rgba(84,84,84,0.4)';//grey, 0.4 opacity
            }
            else  if (status === 'DONE') {
                fillColor  = 'rgba(255,165,0,0.4)';//orange, 0.4 opacity
            }
            else  if (status === 'VALIDATED') {
                fillColor  = 'rgba(0,128,0,0.4)';//green, 0.4 opacity
            }

            // calculate the outline colour, weight and opacity settings based on status, use rgba because
            // this is the way to set opacity in OL3, but also better for cross browser than named colors
            var outlineColor = typeof(isLocked) === "boolean" && isLocked ? 'rgba(255,165,0,1)' : 'rgba(84,84,84,0.7)';
            var outlineWeight = typeof(isLocked) === "boolean"&& isLocked ? 2 : 1;

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
