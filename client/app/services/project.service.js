(function () {
    'use strict';

    angular
        .module('taskingManager')
        .service('projectService', ['$http', '$q', 'mapService','configService', 'geospatialService', projectService]);

    /**
     * @fileoverview This file provides a project service.
     * It generates the task grid for the project using Turf.js (spatial analysis)
     * The task grid matches up with OSM's grid.
     * Code is similar to Tasking Manager 2 (where this was written server side in Python)
     */
    function projectService($http, $q, mapService, configService, geospatialService) {

        // Maximum resolution of OSM
        var MAXRESOLUTION = 156543.0339;

        // X/Y axis offset
        var AXIS_OFFSET = MAXRESOLUTION * 256 / 2;

        var map = null;
        var taskGrid = null;
        var aoi = null;
        var projectServiceDefined = null;
        
        // OpenLayers source for the task grid
        var taskGridSource = null;

        var service = {
            init: init,
            createTaskGrid: createTaskGrid,
            getTaskGrid: getTaskGrid,
            validateAOI: validateAOI,
            setTaskGrid: setTaskGrid,
            removeTaskGrid: removeTaskGrid,
            getTaskSize: getTaskSize,
            getNumberOfTasks: getNumberOfTasks,
            addTaskGridToMap: addTaskGridToMap,
            createProject: createProject,
            setAOI: setAOI,
            getAOI: getAOI,
            splitTasks: splitTasks,
            getProject: getProject,
            getProjectMetadata: getProjectMetadata,
            updateProject: updateProject
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
            // Use a high Z index to ensure it draws on top of other layers
            vector.setZIndex(100);
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
            var areaOfInterestGeoJSON = geospatialService.getGeoJSONFromFeature(areaOfInterest);

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
                    var taskFeatureGeoJSON = geospatialService.getGeoJSONFromFeature(taskFeature);
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
            var taskGeoJSON = geospatialService.getGeoJSONFromFeature(taskGrid[0]);
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
         * Get the AOI
         * @returns {*}
         */
        function getAOI(){
            return aoi;
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
            for (var featureCount = 0; featureCount < features.length; featureCount++) {
                if (features[featureCount].getGeometry() instanceof ol.geom.MultiPolygon){
                    // it should only have one polygon per multipolygon at the moment
                    var polygonsInFeatures = features[featureCount].getGeometry().getPolygons();
                    var hasSelfIntersections;
                    for (var polyCount = 0; polyCount < polygonsInFeatures.length; polyCount++){
                        var feature = new ol.Feature({
                            geometry: polygonsInFeatures[polyCount]
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
                    var hasSelfIntersections = checkFeatureSelfIntersections_(features[featureCount]);
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

            var drawnPolygonGeoJSON = geospatialService.getGeoJSONObjectFromFeature(drawnPolygon);
            
            var newTaskGrid = [];
            for (var i = 0; i < taskGrid.length; i++){
                var taskGeoJSON = geospatialService.getGeoJSONObjectFromFeature(taskGrid[i]);
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
         function checkFeatureSelfIntersections_(feature) {
             var hasSelfIntersections = false;
             var featureAsGeoJSON = geospatialService.getGeoJSONObjectFromFeature(feature);
             if (turf.kinks(featureAsGeoJSON).features.length > 0) {
                 hasSelfIntersections = true;
             }
             return hasSelfIntersections;
         }

        /**
         * Creates a project by calling the API with the AOI, a task grid and a project name
         * @returns {*|!jQuery.jqXHR|!jQuery.Promise|!jQuery.deferred}
         */
        function createProject(projectName){

            var areaOfInterestGeoJSON = geospatialService.getGeoJSONObjectFromFeatures(aoi);
            var taskGridGeoJSON = geospatialService.getGeoJSONObjectFromFeatures(taskGrid);
            
            // Get the geometry of the area of interest. It should only have one feature.
            var newProject = {
                areaOfInterest: areaOfInterestGeoJSON.features[0].geometry,
                projectName: projectName,
                tasks: taskGridGeoJSON
            };
            
            // Returns a promise
            return $http({
                method: 'PUT',
                url: configService.tmAPI + '/admin/project',
                data: newProject,
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'
                }
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return (response.data);
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            });
        }

        /**
         * Get a project JSON
         * @param id - project id
         * @returns {!jQuery.Promise|*|!jQuery.deferred|!jQuery.jqXHR}
         */
        function getProject(id){

            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/project/' + id,
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    //TODO - Accept-Language header hardcoded for now
                    'Accept-Language': 'en'
                }
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return response.data;
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            });
        }

        /**
         * Get a project JSON
         * @param id - project id
         * @returns {!jQuery.Promise|*|!jQuery.deferred|!jQuery.jqXHR}
         */
        function getProjectMetadata(id){

            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/admin/project/' + id,
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'
                }
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return response.data;
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            });
        }

        /**
         * Updates a project 
         * @param id
         * @returns {*|!jQuery.deferred|!jQuery.jqXHR|!jQuery.Promise}
         */
        function updateProject(id, projectData){
            
            // Returns a promise
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/admin/project/' + id,
                data: projectData,
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'    
                }
            }).then(function successCallback(response) {
                // this callback will be called asynchronously 
                // when the response is available
                return response.data;
            }, function errorCallback() {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return $q.reject("error");
            })
        }
    }
})();