(function () {
    'use strict';

    angular
        .module('taskingManager')
        .service('projectService', ['mapService', projectService]);

    /**
     * @fileoverview This file provides a project service.
     * It generates the task grid for the project using Turf.js (spatial analysis)
     * The task grid matches up with OSM's grid.
     * Code is similar to Tasking Manager 2 (where this was written server side in Python)
     */
    function projectService(mapService) {

        // Maximum resolution of OSM
        var MAXRESOLUTION = 156543.0339;

        // X/Y axis offset
        var AXIS_OFFSET = MAXRESOLUTION * 256 / 2;

        // Target projection for Turf.js
        var TARGETPROJECTION = 'EPSG:4326';

        // Map projection in OpenLayers
        var MAPPROJECTION = 'EPSG:3857';

        var map = null;
        var taskGrid = null;
        var aoi = null;
        var projectServiceDefined = null;
        var zoomLevel = 0;
        
        // OpenLayers source for the task grid
        var taskGridSource = null;

        var service = {
            init: init,
            createTaskGrid: createTaskGrid,
            getTaskGrid: getTaskGrid,
            setTaskGrid: setTaskGrid,
            removeTaskGrid: removeTaskGrid,
            getTaskSize: getTaskSize,
            getNumberOfTasks: getNumberOfTasks,
            addTaskGridToMap: addTaskGridToMap,
            setAOI: setAOI,
            validateAOI: validateAOI,
            splitTasks: splitTasks
        };

        return service;
        
        /**
         * Initialise the draw tools
         */
        function init() {
            if (!projectServiceDefined) {
                map = mapService.getOSMMap();
                addVectorLayer();
                projectServiceDefined = true;
            }
        }

        /**
         * Adds a vector layer to the map which is needed for the draw tool
         */
        function addVectorLayer(){
            taskGridSource = new ol.source.Vector();
            var vector = new ol.layer.Vector({
                source: taskGridSource
            });
            map.addLayer(vector);
        }

        /**
         * Creates a task grid with features for a polygon feature.
         * It snaps to the OSM grid
         * @param areaOfInterest (ol.Feature) - this should be a polygon
         * @param zoomLevel - the OSM zoom level the task squares will align with
         */
        function createTaskGrid(areaOfInterest, zoomLevel) {

            var zoomLevel = zoomLevel;

            var extent = areaOfInterest.getGeometry().getExtent();

            var format = new ol.format.GeoJSON();

            // Convert feature to GeoJSON for Turf.js to process
            var areaOfInterestGeoJSON = format.writeFeature(areaOfInterest, {
                dataProjection: TARGETPROJECTION,
                featureProjection: MAPPROJECTION
            });

            var xmin = Math.ceil(extent[0]);
            var ymin = Math.ceil(extent[1]);
            var xmax = Math.floor(extent[2]);
            var ymax = Math.floor(extent[3]);

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
                        taskFeature.setProperties({
                            'x': x,
                            'y': y,
                            'zoom': zoomLevel
                        });
                        taskFeatures.push(taskFeature);
                    }
                }
            }
            return taskFeatures;
        }

        /**
         * Return the task grid
         * @returns {*}
         */
        function getTaskGrid(){
            return taskGrid;
        }

        /**
         * Sets the task grid
         * @param grid
         */
        function setTaskGrid(grid){
            taskGrid = grid;
        }

        /**
         * Remove the task grid from the map 
         */
        function removeTaskGrid(){
            taskGridSource.clear();
            taskGrid = null;
        }

        /**
         * Get the task size in square kilometers
         * Only use this when using a task grid. It takes the first task in the array to calculate the task size
         * so for arbitrary  tasks it wouldn't be representative.
         * Use Turf.js to calculate the area of one of the task sizes
         * @returns {number} the size of the task
         */
        function getTaskSize(){
            // Write the feature as GeoJSON and transform to the projection Turf.js needs
            var format = new ol.format.GeoJSON();
            var taskGeoJSON = format.writeFeature(taskGrid[0], {
                dataProjection: TARGETPROJECTION,
                featureProjection: MAPPROJECTION
            });
            return turf.area(JSON.parse(taskGeoJSON)) / 1000000;
        }

        /**
         * Return the number of tasks in the task grid
         * @returns {number} of tasks in the task grid
         */
        function getNumberOfTasks(){
            var numberOfTasks = 0;
            if (taskGrid){
                numberOfTasks = taskGrid.length;
            }
            return numberOfTasks;
        }

        /**
         * Add the task grid to the map
         */
        function addTaskGridToMap(){
            // Add the task grid features to the vector layer on the map
            taskGridSource.addFeatures(taskGrid);
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
            var multiPolygon = new ol.geom.MultiPolygon();
            multiPolygon.appendPolygon(polygon);
            var feature = new ol.Feature({
                geometry: multiPolygon
            });
            return feature;
        }

        /** 
         * Set the AOI
         * @param areaOfInterest
         */
        function setAOI(areaOfInterest){
            aoi = areaOfInterest;
        }

        /**
         * Validate a candidate AOI.
         * Supports Polygons and MultiPolygons
         * @param features to be validated {*|ol.Collection.<ol.Feature>|Array.<ol.Feature>}
         * @returns {{valid: boolean, message: string}}
         */
        function validateAOI(features){

            var validationResult = {
                valid: true,
                message: ''
            };

            // check we have a non empty array of things
            if (!features || !features.length || features.length == 0){
                validationResult.valid = false;
                validationResult.message = 'NO_FEATURES';
                return validationResult;
            }

            //check we have an array of ol.Feature objects
            for (var i = 0; i < features.length; i++) {
                if (!(features[i] instanceof ol.Feature)) {
                    validationResult.valid = false;
                    validationResult.message = 'UNKNOWN_OBJECT_CLASS';
                    return validationResult;
                }
            }

            // check for self-intersections
            for (var j = 0; j < features.length; j++) {
                if (features[j].getGeometry() instanceof ol.geom.MultiPolygon){
                    // it should only have one polygon per multipolygon at the moment
                    var polygonsInFeatures = features[j].getGeometry().getPolygons();
                    var hasSelfIntersections;
                    for (var k = 0; k < polygonsInFeatures.length; k++){
                        var feature = new ol.Feature({
                            geometry: polygonsInFeatures[k]
                        });
                        var selfIntersect = checkFeatureSelfIntersections_(feature);
                        if (selfIntersect){
                            hasSelfIntersections = true;
                            // If only one self intersection exists, return as having self intersections
                            break;
                        }
                    }
                    if (hasSelfIntersections){
                        validationResult.valid = false;
                        validationResult.message = 'SELF_INTERSECTIONS';
                        return validationResult;
                    }
                }
                else {
                    var hasSelfIntersections = checkFeatureSelfIntersections_(features[j]);
                    if (hasSelfIntersections){
                        validationResult.valid = false;
                        validationResult.message = 'SELF_INTERSECTIONS';
                        return validationResult;
                    }
                }

            }
            return validationResult;
        }

        /**
         * Splits the tasks into four for every task that intersects the drawn polygon
         * and updates the task grid.
         * @param drawnPolygon
         */
        function splitTasks(drawnPolygon){

            var format = new ol.format.GeoJSON();

            // Write the polygon as GeoJSON and transform to the projection Turf.js needs
            var drawnPolygonGeoJSON = format.writeFeatureObject(drawnPolygon, {
                dataProjection: TARGETPROJECTION,
                featureProjection: MAPPROJECTION
            });
            
            var newTaskGrid = [];
            for (var i = 0; i < taskGrid.length; i++){
                // Write the feature as GeoJSON and transform to the projection Turf.js needs
                var taskGeoJSON = format.writeFeatureObject(taskGrid[i], {
                    dataProjection: TARGETPROJECTION,
                    featureProjection: MAPPROJECTION
                });
                // Check if the task intersects with the drawn polygon
                var intersection = turf.intersect(drawnPolygonGeoJSON, taskGeoJSON);
                // If the task doesn't intersect with the drawn polygon, copy the existing task into the new task grid
                if (!intersection) {
                    newTaskGrid.push(taskGrid[i]);
                }
                // If the task does intersect, get the split tasks and add these to the new task grid
                else {
                    var grid = getSplitTasks(taskGrid[i]);
                    for (var j = 0; j < grid.length; j++){
                        newTaskGrid.push(grid[j]);
                    }
                }
            }
            // Remove the old task grid and add the new one to the map
            removeTaskGrid();
            setTaskGrid(newTaskGrid);
            addTaskGridToMap();
        }

        /**
         * Get the split tasks for a single task
         * @param task
         * @returns {*}
         */
        function getSplitTasks(task){
            // For smaller tasks, increase the zoom level by 1
            var zoomLevel = task.getProperties().zoom + 1;
            var grid = createTaskGrid(task, zoomLevel);
            return grid;
        }
        
         /**
         * Check an individual feature for self intersections with Turf.js
         * Only supports Polygons
         * @param feature - has to be a Polygon
         * @returns {boolean}
         */
        function checkFeatureSelfIntersections_(feature){
            var format = new ol.format.GeoJSON();
            var hasSelfIntersections = false;
            var feature_as_gj = format.writeFeatureObject(feature, {
                dataProjection: TARGETPROJECTION,
                featureProjection: MAPPROJECTION
            });
            if (turf.kinks(feature_as_gj).features.length > 0) {
                hasSelfIntersections = true;
            }
            return hasSelfIntersections;
        }
    }
})();