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

        // X/Y axis offset
        var AXIS_OFFSET = MAXRESOLUTION * 256 / 2;

        // Target projection for Turf.js
        var TARGETPROJECTION = 'EPSG:4326';

        // Map projection in OpenLayers
        var MAPPROJECTION = 'EPSG:3857';

        var taskGrid = null;

        var service = {
            getTaskGrid: getTaskGrid,
            getTaskSize: getTaskSize
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
            var step = AXIS_OFFSET / (Math.pow(2, (zoomLevel - 1)));

            // Calculate the min and max task indices at the required zoom level to cover the whole area of interest
            var xminstep = parseInt(Math.floor((xmin + AXIS_OFFSET) / step));
            var xmaxstep = parseInt(Math.ceil((xmax + AXIS_OFFSET) / step));
            var yminstep = parseInt(Math.floor((ymin + AXIS_OFFSET) / step));
            var ymaxstep = parseInt(Math.ceil((ymax + AXIS_OFFSET) / step));

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
            // Store the task features in the service
            taskGrid = taskFeatures;
            return taskFeatures;
        }

        /**
         * Get the task size in square meters or kilometers
         * Use Turf.js to calculate the area of one of the task sizes
         * @param taskGrid
         * @returns {*}
         */
        function getTaskSize(taskGrid){
            // Write the feature as GeoJSON and transform to the projection Turf.js needs
            var format = new ol.format.GeoJSON();
            var taskGeoJSON = format.writeFeature(taskGrid[0], {
                dataProjection: TARGETPROJECTION,
                featureProjection: MAPPROJECTION
            });
            var taskSize = turf.area(JSON.parse(taskGeoJSON));
            if (taskSize >= 1000000){
                return Math.round(taskSize / 1000000) + ' km';
            }
            else {
                return Math.round(taskSize) + ' m';
            }
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
            var xmin = x * step - AXIS_OFFSET;
            var ymin = y * step - AXIS_OFFSET;
            var xmax = (x + 1) * step - AXIS_OFFSET;
            var ymax = (y + 1) * step - AXIS_OFFSET;
            var polygon = new ol.geom.Polygon.fromExtent([xmin, ymin, xmax, ymax]);
            var feature = new ol.Feature({
                geometry: polygon
            });
            return feature;
        }
    }
})();