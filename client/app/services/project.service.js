(function () {
    'use strict';

    angular
        .module('taskingManager')
        .service('projectService', ['$http', '$q', 'configService', 'authService', 'geospatialService', projectService]);

    /**
     * @fileoverview This file provides a project service.
     * It generates the task grid for the project using Turf.js (spatial analysis)
     * The task grid matches up with OSM's grid.
     * Code is similar to Tasking Manager 2 (where this was written server side in Python)
     */
    function projectService($http, $q, configService, authService, geospatialService) {

        // Maximum resolution of OSM
        var MAXRESOLUTION = 156543.0339;

        // X/Y axis offset
        var AXIS_OFFSET = MAXRESOLUTION * 256 / 2;

        var map = null;
        var taskGrid = null;
        var aoi = null;

        // OpenLayers source for the task grid
        var taskGridSource = null;

        var service = {
            initDraw: initDraw,
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
            updateProject: updateProject,
            deleteProject: deleteProject,
            invalidateAllTasks: invalidateAllTasks,
            validateAllTasks: validateAllTasks,
            getCommentsForProject: getCommentsForProject,
            userCanMapProject: userCanMapProject,
            userCanValidateProject: userCanValidateProject,
            getMyProjects: getMyProjects,
            trimTaskGrid: trimTaskGrid,
            createTasksFromFeatures: createTasksFromFeatures
        };

        return service;

        /**
         * Initialise the draw tools
         */
        function initDraw(OLmap) {
            map = OLmap;
            addVectorLayer();
        }

        /**
         * Adds a vector layer to the map which is needed for the draw tool
         */
        function addVectorLayer() {
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
         * @param areaOfInterestExtent (ol.Extent) - this should be a polygon
         * @param zoomLevel - the OSM zoom level the task squares will align with
         */
        function createTaskGrid(areaOfInterestExtent, zoomLevel) {

            var xmin = Math.ceil(areaOfInterestExtent[0]);
            var ymin = Math.ceil(areaOfInterestExtent[1]);
            var xmax = Math.floor(areaOfInterestExtent[2]);
            var ymax = Math.floor(areaOfInterestExtent[3]);

            // task size (in meters) at the required zoom level
            var step = AXIS_OFFSET / (Math.pow(2, (zoomLevel - 1)));

            // Calculate the min and max task indices at the required zoom level to cover the whole area of interest
            var xminstep = parseInt(Math.floor((xmin + AXIS_OFFSET) / step));
            var xmaxstep = parseInt(Math.ceil((xmax + AXIS_OFFSET) / step));
            var yminstep = parseInt(Math.floor((ymin + AXIS_OFFSET) / step));
            var ymaxstep = parseInt(Math.ceil((ymax + AXIS_OFFSET) / step));

            var taskFeatures = [];
            // Generate an array of task features
            for (var x = xminstep; x < xmaxstep; x++) {
                for (var y = yminstep; y < ymaxstep; y++) {
                    var taskFeature = createTaskFeature_(step, x, y);
                    console.log(x+','+y);
                    taskFeature.setProperties({
                        'x': x,
                        'y': y,
                        'zoom': zoomLevel,
                        'splittable': true
                    });
                    taskFeatures.push(taskFeature);
                }
            }

            return taskFeatures;
        }

        /**
         * Return the task grid
         * @returns {*}
         */
        function getTaskGrid() {
            return taskGrid;
        }

        /**
         * Sets the task grid
         * @param grid
         */
        function setTaskGrid(grid) {
            taskGrid = grid;
        }

        /**
         * Remove the task grid from the map
         */
        function removeTaskGrid() {
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
        function getTaskSize() {
            var taskGeoJSON = geospatialService.getGeoJSONFromFeature(taskGrid[0]);
            return turf.area(JSON.parse(taskGeoJSON)) / 1000000;
        }

        /**
         * Return the number of tasks in the task grid
         * @returns {number} of tasks in the task grid
         */
        function getNumberOfTasks() {
            var numberOfTasks = 0;
            if (taskGrid) {
                numberOfTasks = taskGrid.length;
            }
            return numberOfTasks;
        }

        /**
         * Add the task grid to the map
         */
        function addTaskGridToMap() {
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
        function setAOI(areaOfInterest) {
            aoi = areaOfInterest;
        }

        /**
         * Get the AOI
         * @returns {*}
         */
        function getAOI() {
            return aoi;
        }

        /**
         * Validate a candidate AOI.
         * Supports Polygons and MultiPolygons
         * @param features to be validated {*|ol.Collection.<ol.Feature>|Array.<ol.Feature>}
         * @returns {{valid: boolean, message: string}}
         */
        function validateAOI(features) {
            var validationResult = {
                valid: true,
                message: ''
            };

            // check we have a non empty array of things
            if (!features || !features.length || features.length == 0) {
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

            // check everything is a polygon of multiPolygon
            var allPolygonTypes = features.every(function (feature) {
                var type = feature.getGeometry().getType();
                return type === 'MultiPolygon' || type === 'Polygon'
            });
            if (!allPolygonTypes) {
                validationResult.valid = false;
                validationResult.message = 'CONTAINS_NON_POLYGON_FEATURES';
                return validationResult;
            }

            // check for self-intersections
            for (var featureCount = 0; featureCount < features.length; featureCount++) {
                var hasSelfIntersections = false;
                var featuresToCheck = [];
                if (features[featureCount].getGeometry().getType() === 'MultiPolygon') {
                    features[featureCount].getGeometry().getPolygons().forEach(function (geom) {
                        var feature = new ol.Feature({
                            geometry: geom
                        });
                        this.push(feature);
                    }, featuresToCheck);
                }
                else {
                    featuresToCheck.push(features[featureCount]);
                }
                var hasSelfIntersections = featuresToCheck.every(function (feature) {
                    return checkFeatureSelfIntersections_(feature)
                });

                if (hasSelfIntersections) {
                    validationResult.valid = false;
                    validationResult.message = 'SELF_INTERSECTIONS';
                    return validationResult;
                }
            }
            return validationResult;
        }

        /**
         * Splits the tasks into four for every task that intersects the drawn polygon
         * and updates the task grid.
         * @param drawnPolygon
         */
        function splitTasks(drawnPolygon) {

            var drawnPolygonGeoJSON = geospatialService.getGeoJSONObjectFromFeature(drawnPolygon);

            var newTaskGrid = [];
            for (var i = 0; i < taskGrid.length; i++) {
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
                    for (var j = 0; j < grid.length; j++) {
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
        function getSplitTasks(task) {
            // For smaller tasks, increase the zoom level by 1
            var zoomLevel = task.getProperties().zoom + 1;
            var grid = createTaskGrid(task.getGeometry().getExtent(), zoomLevel);
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
        function createProject(projectName) {

            var areaOfInterestGeoJSON = geospatialService.getGeoJSONObjectFromFeatures(aoi);
            var taskGridGeoJSON = geospatialService.getGeoJSONObjectFromFeatures(taskGrid);

            // Get the geometry of the area of interest. It should only have one feature.
            var newProject = {
                areaOfInterest: areaOfInterestGeoJSON,
                projectName: projectName,
                tasks: taskGridGeoJSON
            };

            // Returns a promise
            return $http({
                method: 'PUT',
                url: configService.tmAPI + '/admin/project',
                data: newProject,
                headers: authService.getAuthenticatedHeader()
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
        function getProject(id) {

            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/project/' + id,
                headers: authService.getAuthenticatedHeader()
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
        function getProjectMetadata(id) {

            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/admin/project/' + id,
                headers: authService.getAuthenticatedHeader()
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
        function updateProject(id, projectData) {

            // Returns a promise
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/admin/project/' + id,
                data: projectData,
                headers: authService.getAuthenticatedHeader()
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

        /**
         * Deletes a project
         * @param id
         * @returns {*|!jQuery.Promise|!jQuery.deferred|!jQuery.jqXHR}
         */
        function deleteProject(id) {

            // Returns a promise
            return $http({
                method: 'DELETE',
                url: configService.tmAPI + '/admin/project/' + id,
                headers: authService.getAuthenticatedHeader()
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

        /**
         * Invalidate all tasks on the project
         * @param projectId
         * @param comment
         * @returns {!jQuery.deferred|*|!jQuery.jqXHR|!jQuery.Promise}
         */
        function invalidateAllTasks(projectId) {
            // Returns a promise
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/admin/project/' + projectId + '/invalidate-all',
                headers: authService.getAuthenticatedHeader()
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

        /**
         * Validate all tasks on the project
         * @param projectId
         * @param comment
         * @returns {!jQuery.deferred|*|!jQuery.jqXHR|!jQuery.Promise}
         */
        function validateAllTasks(projectId) {
            // Returns a promise
            return $http({
                method: 'POST',
                url: configService.tmAPI + '/admin/project/' + projectId + '/validate-all',
                headers: authService.getAuthenticatedHeader()
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

        /** Get comments for a project
         * @param id
         * @returns {*|!jQuery.jqXHR|!jQuery.deferred|!jQuery.Promise}
         */
        function getCommentsForProject(id) {

            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/admin/project/' + id + '/comments',
                headers: authService.getAuthenticatedHeader()
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
         * enumerate mapper levels
         * @param levelText
         * @returns {string|*}
         */
        function enumerateMapperLevel(levelText) {
            var levelEnum = -1;
            switch (levelText) {
                case 'BEGINNER':
                    levelEnum = 1;
                    break;
                case 'INTERMEDIATE':
                    levelEnum = 2;
                    break;
                case 'ADVANCED':
                    levelEnum = 3;
                    break;
            }
            return levelEnum;
        }

        /**
         * Convenience function for logic associated with deciding if a user can map on a project
         * TODO this should be an api call since we should not have business logic in the client
         * @param userLevel
         * @param projectLevel
         * @param enforceLevel
         * @returns {boolean}
         */
        function userCanMapProject(userLevel, projectLevel, enforceLevel) {
            if (enforceLevel) {
                var userLevel = enumerateMapperLevel(userLevel);
                var projectLevel = enumerateMapperLevel(projectLevel);
                return (userLevel >= projectLevel);
            }
            return true;
        }

        /**
         * Convenience function for logic associated with deciding if a user can validate on a project
         * TODO this should be an api call since we should not have business logic in the client
         * @param userRole
         * @param enforceValidateRole*
         * @returns {boolean}
         */
        function userCanValidateProject(userRole, enforceValidateRole) {
            if (enforceValidateRole) {
                var validatorRoles = ['ADMIN', 'PROJECT_MANAGER', 'VALIDATOR'];
                return validatorRoles.indexOf(userRole) != -1;
            }
            return true;
        }

        /**
         * Get my projects
         * @returns {*|!jQuery.jqXHR|!jQuery.deferred|!jQuery.Promise}
         */
        function getMyProjects() {
            // Returns a promise
            return $http({
                method: 'GET',
                url: configService.tmAPI + '/admin/my-projects',
                headers: authService.getAuthenticatedHeader()
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
         * Creates a new task grid which has been trimmed to the aoi
         * @param clipTasksToAoi
         * @returns {*|!jQuery.jqXHR|!jQuery.Promise|!jQuery.deferred}
         */
        function trimTaskGrid(clipTasksToAoi) {
            // TODO the aoi may have more than one feature when dealing with imported aoi's
            var areaOfInterestGeoJSON = geospatialService.getGeoJSONObjectFromFeatures(aoi, 'EPSG:3857');
            var taskGridGeoJSON = geospatialService.getGeoJSONObjectFromFeatures(taskGrid, 'EPSG:3857');

            //create the data for the post
            var gridAndAoi = {
                areaOfInterest: areaOfInterestGeoJSON,
                clipToAoi: clipTasksToAoi,
                grid: taskGridGeoJSON
            };

            // Returns a promise
            return $http({
                method: 'PUT',
                url: configService.tmAPI + '/grid/intersecting-tiles',
                data: gridAndAoi,
                headers: authService.getAuthenticatedHeader()
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                return (response.data);
            }, function errorCallback(reason) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.

                return $q.reject(reason);
            });

        }

        /**
         *
         */
        function createTasksFromFeatures(features) {
            var tasks = [];
            for (var i = 0; i < features.length; i++) {
                var task = features[i].clone();
                var type = task.getGeometry().getType();
                if (type === 'Polygon') {
                    var multiPolygon = new ol.geom.MultiPolygon();
                    multiPolygon.appendPolygon(task.getGeometry());
                    task.setGeometry(multiPolygon)
                }
                else if(type !== 'MultiPolygon'){
                    continue; //ignore anything that isn't a polygon or multiPolygon
                }
                task.setId(i + 1);
                task.setProperties({
                        //TODO - check how api validation handles these properties
                        'x': -1,
                        'y': -1,
                        'zoom': -1,
                        'splittable': false
                });
                tasks.push(task);
            }
            return tasks;

        }
    }
})();