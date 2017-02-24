(function () {
    'use strict';

    angular
        .module('taskingManager')
        .service('projectService', [projectService]);

    /**
     * @fileoverview This file provides a project service.
     * It generates the task grid for the project using Turf.js (spatial analysis)
     * The task grid matches up with OSM's grid.
     * Code is similar to Tasking Manager 2 (where this was written server side in Python)
     */
    function projectService() {

        // Maximum resolution of OSM
        var MAXRESOLUTION = 156543.0339;

        // X/Y axis limit
        var MAX = MAXRESOLUTION * 256 / 2;

        // Target projection for Turf.js
        var TARGETPROJECTION = 'EPSG:4326';

        // Map projection in OpenLayers
        var MAPPROJECTION = 'EPSG: 3857';

        var service = {
            getTaskGrid: getTaskGrid
        };

        return service;

        /**
         * Creates a task grid with features for a polygon feature.
         * It snaps to the OSM grid
         * @param areaOfInterest (ol.Feature) - this should be a polygon
         * @param zoomLevel - the OSM zoom level the task squares will align with
         * @returns {Array} of Features
         */
        function getTaskGrid(areaOfInterest, zoomLevel) {

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
            var step = MAX / (Math.pow(2, (zoomLevel - 1)));

            // Calculate the min and max task indices at the required zoom level to cover the whole area of interest
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
                    // Check if the generated task feature intersects with the area of interest
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
         * Returns a task feature with a polygon geometry defining the task area
         * @param step (task size in meters)
         * @param x (x task index)
         * @param y (y task index)
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