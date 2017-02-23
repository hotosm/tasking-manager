(function () {
    'use strict';

    angular
        .module('taskingManager')
        .service('gridService', [gridService]);

    /**
     * @fileoverview This file provides a task service.
     * It generates the tasks squares using Turf.js (spatial analysis)
     * The task square grid matches up with OSM's grid.
     * Code is similar to Tasking Manager 2 (where this was written server side in Python)
     */
    function gridService() {

        // Maximum resolution of OSM
        var MAXRESOLUTION = 156543.0339;

        // X/Y axis limit
        var MAX = MAXRESOLUTION * 256 / 2;

        // Target projection for Turf.js
        var TARGETPROJECTION = 'EPSG:4326';

        // Map projection in OpenLayers
        var MAPPROJECTION = 'EPSG: 3857';

        var service = {
            getTaskFeaturesInAOIFeature: getTaskFeaturesInAOIFeature
        };

        return service;

        /**
         * Creates task features for a polygon feature.
         * It snaps to the OSM grid
         * @param areaOfInterest (ol.Feature) - this should be a polygon
         * @param zoom
         * @returns {Array} of Features
         */
        function getTaskFeaturesInAOIFeature(areaOfInterest, zoom) {

            var extent = areaOfInterest.getGeometry().getExtent();

            var format = new ol.format.GeoJSON();

            // Convert feature to GeoJSON for Turf.js to process
            var areaOfInterestGeoJSON = format.writeFeature(areaOfInterest, {
                dataProjection: TARGETPROJECTION,
                featureProjection: MAPPROJECTION
            });

            var xmin = extent[0];
            var ymin = extent[1];
            var xmax = extent[2];
            var ymax = extent[3];

            // task size (in meters) at the required zoom level
            var step = MAX / (Math.pow(2, (zoom - 1)));

            // Create the
            var xminstep = parseInt(Math.floor((xmin + MAX) / step));
            var xmaxstep = parseInt(Math.ceil((xmax + MAX) / step));
            var yminstep = parseInt(Math.floor((ymin + MAX) / step));
            var ymaxstep = parseInt(Math.ceil((ymax + MAX) / step));

            // Generate an array of task features
            var taskFeatures = [];
            for (var x = xminstep; x < xmaxstep; x++) {
                for (var y = yminstep; y < ymaxstep; y++) {
                    var taskFeature = createTaskFeature_(step, x, y);
                    // Write the feature as GeoJSON and transform to the projection Turf.js needs
                    var taskFeatureGeoJSON = format.writeFeature(taskFeature, {
                        dataProjection: TARGETPROJECTION,
                        featureProjection: MAPPROJECTION
                    });
                    // Check if the generated task feature intersects with the are of interest
                    var intersection = turf.intersect(JSON.parse(taskFeatureGeoJSON), JSON.parse(areaOfInterestGeoJSON));
                    // Add the task feature to the array if it intersects
                    if (intersection) {
                        taskFeatures.push(taskFeature);
                    }
                }
            }
            return taskFeatures;
        }

        /**
         * Returns a task feature with a polygon geometry defining the task
         * @param step
         * @param x
         * @param y
         * @returns {ol.Feature}
         * @private
         */
        function createTaskFeature_(step, x, y) {
            var xmin = x * step - MAX;
            var ymin = y * step - MAX;
            var xmax = (x + 1) * step - MAX;
            var ymax = (y + 1) * step - MAX;
            var polygon = new ol.geom.Polygon.fromExtent([xmin, ymin, xmax, ymax]);
            var feature = new ol.Feature({
                geometry: polygon
            });
            return feature;
        }
    }
})();