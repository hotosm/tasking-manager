(function () {

    'use strict';

    /**
     * Project controller which manages activating a project the UI for user task selection and contribution workflow
     */
    angular
        .module('taskingManager')
        .controller('projectController', ['$interval', '$scope', '$routeParams', '$window', 'mapService', 'projectService', 'styleService', 'taskService', 'geospatialService', 'editorService', 'authService', 'accountService', projectController]);

    function projectController($interval, $scope, $routeParams, $window, mapService, projectService, styleService, taskService, geospatialService, editorService, authService, accountService) {
        var vm = this;
        vm.projectData = null;
        vm.taskVectorLayer = null;
        vm.highlightVectorLayer = null;
        vm.map = null;
        vm.user = {};

        // tab and view control
        vm.currentTab = '';
        vm.mappingStep = '';
        vm.validatingStep = '';
        vm.taskError = '';
        vm.taskErrorValidation = '';
        vm.taskLockError = false;
        vm.taskUnLockError = false;
        vm.isAuthorized = false;
        vm.selectedEditor = '';
        vm.taskLockErrorMessage = '';

        //selected task
        vm.selectedTaskData = null;
        vm.isSelectedMappable = false;
        vm.isSelectedValidatable = false;

        //locked task
        vm.lockedTaskData = null;

        //multi-validation
        vm.multiSelectedTasksData = [];
        vm.multiLockedTasks = [];


        //project display text
        vm.description = '';
        vm.shortDescription = '';
        vm.instructions = '';

        //editor
        vm.editorStartError = '';

        //interaction
        var select = new ol.interaction.Select({
            style: styleService.getSelectedStyleFunction
        });

        vm.tasksForValidation = {
            doneTasks: [
                {
                    user: 'feenster',
                    level: 'beginner',
                    tasks: [
                        {
                            taskId: 7,
                            timeStamp: '2017-03-10T14:43:27.02348'
                        },
                        {
                            taskId: 38,
                            timeStamp: '2017-03-15T14:43:27.02348'
                        }
                    ]
                },
                {
                    user: 'hunter',
                    level: 'intermediate',
                    tasks: [
                        {
                            taskId: 4,
                            timeStamp: '2017-03-30T15:10:27.02348'
                        },
                        {
                            taskId: 5,
                            timeStamp: '2017-03-30T15:11:27.02348'
                        },
                        {
                            taskId: 6,
                            timeStamp: '2017-03-30T15:12:27.02348'
                        },
                        {
                            taskId: 7,
                            timeStamp: '2017-03-30T15:13:27.02348'
                        }
                    ]
                },
                {
                    user: 'alblas',
                    level: 'advance',
                    tasks: [
                        {
                            taskId: 8,
                            timeStamp: '2017-03-30T10:43:27.02348'
                        },
                        {
                            taskId: 9,
                            timeStamp: '2017-03-30T12:43:27.02348'
                        },
                        {
                            taskId: 10,
                            timeStamp: '2017-03-30T14:43:27.02348'
                        },
                        {
                            taskId: 11,
                            timeStamp: '2017-03-30T18:43:27.02348'
                        }
                    ]
                }
            ]
        }

        //bound from the html
        vm.comment = '';

        //interval timer promise for autorefresh
        var autoRefresh = undefined;

        activate();

        function activate() {

            // Check the user's role
            var session = authService.getSession();
            if (session) {
                var resultsPromise = accountService.getUser(session.username);
                resultsPromise.then(function (user) {
                    vm.user = user;
                });
            }

            vm.currentTab = 'description';
            vm.mappingStep = 'selecting';
            vm.validatingStep = 'selecting';
            vm.selectedEditor = 'ideditor'; // default to iD editor
            mapService.createOSMMap('map');
            mapService.addOverviewMap();
            vm.map = mapService.getOSMMap();

            vm.map.addInteraction(select);
            select.on('select', function (event) {
                $scope.$apply(function () {
                    var feature = event.selected[0];
                    onTaskSelection(feature);
                });
            });

            var id = $routeParams.id;
            initialiseProject(id);

            //start up a timer for autorefreshing the project.
            autoRefresh = $interval(function () {
                refreshProject(id)
            }, 10000);
        }

        // listen for navigation away from the page event and stop the autrefresh timer
        $scope.$on('$locationChangeStart', function(){
             if (angular.isDefined(autoRefresh)) {
                $interval.cancel(autoRefresh);
                autoRefresh = undefined;
            }
        })


        /**
         * calculates padding number to makes sure there is plenty of clear space around feature on map to keep visual
         * context of feature location
         * @returns {number} - padding number
         */
        function getPaddingSize() {
            // padding to makes sure there is plenty of clear space around feature on map to keep visual
            // context of feature location
            return vm.map.getSize()[1] * 0.3;
        }


        /**
         * Make the passed in feature the selected feature and ensure view and map updates for selected feature
         * @param feature - ol.Feature the feature to be selected
         */
        function selectFeature(feature) {
            select.getFeatures().clear();
            select.getFeatures().push(feature);
            onTaskSelection(feature);
        }

        /**
         * Sets up a randomly selected task as the currently selected task
         */
        vm.selectRandomTask = function () {
            var feature = null;
            if (vm.currentTab === 'mapping') {
                feature = taskService.getRandomMappableTaskFeature(vm.taskVectorLayer.getSource().getFeatures());
            }
            else if (vm.currentTab === 'validation') {
                feature = taskService.getRandomTaskFeatureForValidation(vm.taskVectorLayer.getSource().getFeatures());
            }

            if (feature) {
                selectFeature(feature);
                var padding = getPaddingSize();
                vm.map.getView().fit(feature.getGeometry().getExtent(), {padding: [padding, padding, padding, padding]});
            }
            else {
                vm.selectedTaskData = null;
                vm.isSelectedMappable = false;
                vm.isSelectedValidatable = false;
                vm.taskError = 'none-available';
                vm.taskErrorValidation = 'none-available';
                vm.taskLockError = false;
                vm.mappingStep = vm.currentTab === 'mapping' ? 'viewing' : 'selecting';
                vm.validatingStep = vm.currentTab === 'validation' ? 'viewing' : 'selecting';
            }
        };


        /**
         * clears the currently selected task.  Clears down/resets the vm properties and clears the feature param in the select interaction object.
         */
        vm.clearCurrentSelection = function () {
            vm.selectedTaskData = null;
            vm.isSelectedMappable = false;
            vm.mappingStep = 'selecting';
            vm.validatingStep = 'selecting';
            vm.taskError = '';
            vm.taskErrorValidation = '';
            select.getFeatures().clear();
        };

        /**
         * Initilaise a project using it's id
         * @param id - id of the project to initialise
         */
        function initialiseProject(id) {
            var resultsPromise = projectService.getProject(id);
            resultsPromise.then(function (data) {
                //project returned successfully
                vm.projectData = data;
                $scope.description = data.projectInfo.description;
                $scope.shortDescription = data.projectInfo.shortDescription;
                $scope.instructions = data.projectInfo.instructions;
                addAoiToMap(vm.projectData.areaOfInterest);
                addProjectTasksToMap(vm.projectData.tasks, true);
                //add a layer for task highlighting
                if (!vm.highlightVectorLayer) {
                    var source = new ol.source.Vector();
                    vm.highlightVectorLayer = new ol.layer.Vector({
                        source: source,
                        name: 'highlight',
                        style: styleService.getHighlightedStyleFunction
                    });
                    vm.map.addLayer(vm.highlightVectorLayer);
                } else {
                    vm.highlightVectorLayer.getSource().clear();
                }
            }, function () {
                // project not returned successfully
                // TODO - may want to handle error
            });
        }

        /**
         * Gets project data from server and updates the map
         * @param id - id of project to be refreshed
         */
        function refreshProject(id) {
            var resultsPromise = projectService.getProject(id);
            resultsPromise.then(function (data) {
                //project returned successfully
                vm.projectData = data;
                addProjectTasksToMap(vm.projectData.tasks, false);
                if (vm.selectedTaskData) {
                    var selectedFeature = taskService.getTaskFeatureById(vm.taskVectorLayer.getSource().getFeatures(), vm.selectedTaskData.taskId);
                    //this just forces the selected styling to apply
                    select.getFeatures().clear();
                    select.getFeatures().push(selectedFeature);
                }

            }, function () {
                // project not returned successfully
                // TODO - may want to handle error
            });

        }

        /**
         * Adds project tasks to map as features from geojson
         * @param tasks
         * @param fitToProject - boolean to control whether to refit map view to project extent
         */
        function addProjectTasksToMap(tasks, fitToProject) {
            //TODO: may want to refactor this into a service at some point so that it can be reused
            var source;
            if (!vm.taskVectorLayer) {
                source = new ol.source.Vector();
                vm.taskVectorLayer = new ol.layer.Vector({
                    source: source,
                    name: 'tasks',
                    style: styleService.getTaskStyleFunction
                });
                vm.map.addLayer(vm.taskVectorLayer);
            } else {
                source = vm.taskVectorLayer.getSource();
                source.clear();
            }

            var taskFeatures = geospatialService.getFeaturesFromGeoJSON(tasks);
            source.addFeatures(taskFeatures);
            if (fitToProject) {
                vm.map.getView().fit(source.getExtent());
            }
        }

        /**
         * Adds the aoi feature to the map
         * @param aoi
         */
        function addAoiToMap(aoi) {
            //TODO: may want to refactor this into a service at some point so that it can be resused
            var source = new ol.source.Vector();
            var vector = new ol.layer.Vector({
                source: source,
                name: 'aoi'
            });
            vm.map.addLayer(vector);

            // read tasks JSON into features
            var aoiFeature = geospatialService.getFeatureFromGeoJSON(aoi)
            source.addFeature(aoiFeature);
        }

        /**
         * Gets a task from the server and sets up the task returned as the currently selected task
         * @param feature
         */
        function onTaskSelection(feature) {
            //we don't want to allow selection of multiple features by map click


            //get id from feature
            var taskId = feature.get('taskId');
            var projectId = vm.projectData.projectId;

            //reset task errors
            vm.taskError = '';
            vm.taskErrorValidation = '';
            vm.taskLockError = false;

            // get full task from task service call
            var taskPromise = taskService.getTask(projectId, taskId);
            taskPromise.then(function (data) {
                //task returned successfully
                refreshCurrentSelection(data);
                // TODO: This is a bit icky.  Need to find something better.  Maybe when roles are in place.
                // Need to make a decision on what tab to go to if user has clicked map but is not on mapping or validating
                // tab
                if (vm.currentTab === 'description' || vm.currentTab === 'instructions') {
                    //prioritise validation
                    vm.currentTab = vm.isSelectedValidatable ? 'validation' : 'mapping';
                }

            }, function () {
                // task not returned successfully
                vm.selectedTaskData = null;
                vm.isSelectedMappable = false;
                vm.isSelectedValidatable = false;
                vm.taskError = 'task-get-error';
                vm.taskErrorValidation = 'task-get-error';
                vm.mappingStep = 'viewing';
                vm.validatingStep = 'viewing';
                if (vm.currentTab === 'description' || vm.currentTab !== 'instructions') {
                    //prioritise mapping
                    vm.currentTab = 'mapping';
                }
            });
        }

        /**
         * Sets up the view model for the task options and actions for passed in task data object.
         * @param data - task JSON data object
         */
        function refreshCurrentSelection(data) {
            var isLockedByMeMapping = data.taskStatus === 'LOCKED_FOR_MAPPING' && data.lockHolder === vm.user.username;
            var isLockedByMeValidation = data.taskStatus === 'LOCKED_FOR_VALIDATION' && data.lockHolder === vm.user.username;
            vm.isSelectedMappable = isLockedByMeMapping || data.taskStatus === 'READY' || data.taskStatus === 'INVALIDATED' || data.taskStatus === 'BADIMAGERY';
            vm.isSelectedValidatable = isLockedByMeValidation || data.taskStatus === 'MAPPED' || data.taskStatus === 'VALIDATED';
            vm.taskError = vm.isSelectedMappable ? '' : 'task-not-mappable';
            vm.taskErrorValidation = vm.isSelectedValidatable ? '' : 'task-not-validatable';
            vm.selectedTaskData = data;

            //jump to locked step if mappable and locked by me
            if (isLockedByMeMapping) {
                vm.mappingStep = 'locked';
                vm.lockedTaskData = data;
                vm.currentTab = 'mapping';
            }
            else {
                vm.mappingStep = 'viewing';
            }

            //jump to validatable step if validatable and locked by me
            if (isLockedByMeValidation) {
                vm.validatingStep = 'locked';
                vm.lockedTaskData = data;
                vm.currentTab = 'validation';
            }
            else {
                vm.validatingStep = 'viewing';
            }
        }

        /**
         * Call api to unlock currently locked task after mapping.  Will pass the comment and new status to api.  Will update view and map after unlock.
         * @param comment
         * @param status
         */
        vm.unLockTaskMapping = function (comment, status) {
            var projectId = vm.projectData.projectId;
            var taskId = vm.lockedTaskData.taskId;
            var unLockPromise = taskService.unLockTaskMapping(projectId, taskId, comment, status);
            vm.comment = '';
            unLockPromise.then(function (data) {
                refreshProject(projectId);
                if (status == 'MAPPED') {
                    vm.lockedTaskData = null;
                    vm.taskLockError = false;
                    vm.clearCurrentSelection();
                }
                else {
                    vm.lockedTaskData = null;
                    vm.taskLockError = false;
                    refreshCurrentSelection(data);
                }
            }, function (error) {
                onLockUnLockError(projectId, taskId, error);
            });
        };

        /**
         * Call api to unlock currently locked task after validation.  Will pass the comment and new status to api.  Will update view and map after unlock.
         * @param comment
         * @param status
         */
        vm.unLockTaskValidation = function (comment, status) {
            var projectId = vm.projectData.projectId;
            var taskId = vm.lockedTaskData.taskId;
            var tasks = [{
                comment: comment,
                status: status,
                taskId: taskId
            }];
            var unLockPromise = taskService.unLockTaskValidation(projectId, tasks);
            vm.comment = '';
            unLockPromise.then(function (data) {
                refreshProject(projectId);
                vm.lockedTaskData = null;
                vm.taskLockError = false;
                vm.clearCurrentSelection();
            }, function (error) {
                onLockUnLockError(projectId, taskId, error);
            });
        };


        /**
         * Call api to unlock currently locked tasks after validation.  Will pass the comment and new status to api.  Will update view and map after unlock.
         * @param comment
         * @param status
         */
        vm.unLockMultiTaskValidation = function (comment, status) {
            var projectId = vm.projectData.projectId;

            var data = vm.multiLockedTasks;
            var tasks = data.map(function (task) {
                return {
                    comment: comment,
                    status: status ? status : task.taskStatus,
                    taskId: task.taskId
                };
            });

            var unLockPromise = taskService.unLockTaskValidation(projectId, tasks);
            vm.comment = '';
            unLockPromise.then(function (data) {
                refreshProject(projectId);
                vm.multiLockedTasks = null;
                vm.taskUnLockError = false;
                vm.clearCurrentSelection();
            }, function (error) {
                refreshProject(projectId);
                vm.multiLockedTasks = null;
                vm.taskUnLockError = true;
                select.getFeatures().clear();

            });
        };


        /**
         * Call api to lock currently selected task for mapping.  Will update view and map after unlock.
         */
        vm.lockSelectedTaskMapping = function () {
            var projectId = vm.projectData.projectId;
            var taskId = vm.selectedTaskData.taskId;
            // - try to lock the task, call returns a promise
            var lockPromise = taskService.lockTaskMapping(projectId, taskId);
            lockPromise.then(function (data) {
                // refresh the project, to ensure we catch up with any status changes that have happened meantime
                // on the server
                refreshProject(projectId);
                vm.currentTab = 'mapping';
                vm.mappingStep = 'locked';
                vm.selectedTaskData = data;
                vm.isSelectedMappable = true;
                vm.taskError = '';
                vm.taskErrorValidation = '';
                vm.taskLockError = false;
                vm.lockedTaskData = data;
            }, function (error) {
                onLockUnLockError(projectId, taskId, error);
            });
        };

        /**
         * Call api to lock currently selected task for mapping.  Will update view and map after unlock.
         */
        vm.lockSelectedTaskValidation = function () {
            var projectId = vm.projectData.projectId;
            var taskId = vm.selectedTaskData.taskId;
            var taskIds = [taskId];
            // - try to lock the task, call returns a promise
            var lockPromise = taskService.lockTasksValidation(projectId, taskIds);
            lockPromise.then(function (tasks) {
                // refresh the project, to ensure we catch up with any status changes that have happened meantime
                // on the server
                refreshProject(projectId);
                vm.currentTab = 'validation';
                vm.validatingStep = 'locked';
                vm.selectedTaskData = tasks[0];
                vm.isSelectedValidatable = true;
                vm.taskError = '';
                vm.taskLockError = false;
                vm.lockedTaskData = tasks[0];
            }, function (error) {
                onLockUnLockError(projectId, taskId, error);
            });
        };

        /**
         * View OSM changesets by getting the bounding box, transforming the coordinates to WGS84 and passing it to OSM
         */
        vm.viewOSMChangesets = function () {
            var taskId = vm.selectedTaskData.taskId;
            var features = vm.taskVectorLayer.getSource().getFeatures();
            var selectedFeature = taskService.getTaskFeatureById(features, taskId);
            var bbox = selectedFeature.getGeometry().getExtent();
            var bboxTransformed = geospatialService.transformExtentToLatLonString(bbox);
            $window.open('http://www.openstreetmap.org/history?bbox=' + bboxTransformed);
        };

        /**
         * View changes in Overpass Turbo
         */
        vm.viewOverpassTurbo = function () {
            var queryPrefix = '<osm-script output="json" timeout="25"><union>';
            var querySuffix = '</union><print mode="body"/><recurse type="down"/><print mode="skeleton" order="quadtile"/></osm-script>';
            var queryMiddle = '';
            // Get the bbox of the task
            var taskId = vm.selectedTaskData.taskId;
            var features = vm.taskVectorLayer.getSource().getFeatures();
            var selectedFeature = taskService.getTaskFeatureById(features, taskId);
            var extent = selectedFeature.getGeometry().getExtent();
            var bboxTransformed = geospatialService.transformExtentToLatLon(extent);
            var bboxArray = bboxTransformed.split(',');
            var bbox = 'w="' + bboxArray[0] + '" s="' + bboxArray[1] + '" e="' + bboxArray[2] + '" n="' + bboxArray[3] + '"';
            // Loop through the history and get a unique list of users to pass to Overpass Turbo
            var userList = [];
            var history = vm.selectedTaskData.taskHistory;
            if (history) {
                for (var i = 0; i < history.length; i++) {
                    var user = history[i].actionBy;
                    var indexInArray = userList.indexOf(user);
                    if (user && indexInArray == -1) {
                        // user existing and not found in user list yet
                        var userQuery =
                            '<query type="node"><user name="' + user + '"/><bbox-query ' + bbox + '/></query>' +
                            '<query type="way"><user name="' + user + '"/><bbox-query ' + bbox + '/></query>' +
                            '<query type="relation"><user name="' + user + '"/><bbox-query ' + bbox + '/></query>';
                        queryMiddle = queryMiddle + userQuery;
                        userList.push(user);
                    }
                }
            }
            var query = queryPrefix + queryMiddle + querySuffix;
            $window.open('http://overpass-turbo.eu/map.html?Q=' + encodeURIComponent(query));
        };

        /**
         * Start the editor by getting the editor options and the URL to call
         * TODO: complete for all editors
         * See: https://github.com/hotosm/osm-tasking-manager2/blob/d3a3b70d09256ba16bdff1b35909ad4f3b9f66e2/osmtm/static/js/project.js
         * @param editor
         */
        vm.startEditor = function (editor) {

            vm.editorStartError = '';

            var selectedFeatures = select.getFeatures();
            var taskCount = selectedFeatures.getArray().length;
            console.log(taskCount);
            var extent = geospatialService.getBoundingExtentFromFeatures(selectedFeatures.getArray());
            // Zoom to the extent to get the right zoom level for the editorsgit commit -a
            vm.map.getView().fit(extent);
            var extentTransformed = geospatialService.transformExtentToLatLonArray(extent);
            var imageryUrl = 'tms[22]:https://api.mapbox.com/v4/digitalglobe.2lnp1jee/{z}/{x}/{y}.png?' +
                'access_token=pk.eyJ1IjoiZGlnaXRhbGdsb2JlIiwiYSI6ImNpd3A2OTAwODAwNGUyenFuN' +
                'TkyZjRkeWsifQ.Y44JcpYP9gXsZD3p5KBZbA'; // TODO: get imagery URL from project
            var changesetComment = '#TODO #CHANGSET_COMMENT'; // TODO: get changeset comment from project
            // get center in the right projection
            var center = ol.proj.transform(geospatialService.getCenterOfExtent(extent), 'EPSG:3857', 'EPSG:4326');
            // TODO licence agreement
            if (editor === 'ideditor') {
                // TODO: GPX file + imageryURL
                editorService.launchIdEditor(center, changesetComment);
            }
            else if (editor === 'potlatch2') {
                editorService.launchPotlatch2Editor(center);
            }
            else if (editor === 'fieldpapers') {
                editorService.launchFieldPapersEditor(center);
            }
            else if (editor === 'josm') {
                // TODO licence agreement
                var changesetSource = "Bing";
                var hasImagery = false;
                if (typeof imageryUrl != "undefined" && imageryUrl !== '') {
                    changesetSource = imageryUrl;
                    hasImagery = true;
                }
                var loadAndZoomParams = {
                    left: extentTransformed[0],
                    bottom: extentTransformed[1],
                    right: extentTransformed[2],
                    top: extentTransformed[3],
                    changeset_comment: encodeURIComponent(changesetComment),
                    changeset_source: encodeURIComponent(changesetSource)
                };
                var josm_load = taskCount == 1;
                var josm_endpoint = josm_load ? 'http://127.0.0.1:8111/load_and_zoom' : 'http://127.0.0.1:8111/zoom';

                var isLoadAndZoomSuccess = editorService.sendJOSMCmd(josm_endpoint, loadAndZoomParams);
                if (isLoadAndZoomSuccess) {
                    if (hasImagery) {
                        var imageryParams = {
                            title: encodeURIComponent('Tasking Manager - #' + vm.projectData.projectId),
                            type: imageryUrl.toLowerCase().substring(0, 3),
                            url: encodeURIComponent(imageryUrl)
                        };
                        editorService.sendJOSMCmd('http://127.0.0.1:8111/imagery', imageryParams);
                    }
                }
                else {
                    //TODO warn that JSOM couldn't be started
                    vm.editorStartError = 'josm-error';
                }
            }
        };

        /**
         * Refresh the map and selected task on error
         * @param projectId
         * @param taskId
         * @param error
         */
        function onLockUnLockError(projectId, taskId, error) {
            // Could not unlock/lock task
            // Refresh the map and selected task.
            refreshProject(projectId);
            onTaskSelection(taskService.getTaskFeatureById(vm.taskVectorLayer.getSource().getFeatures(), taskId));
            vm.taskLockError = true;
            // Check if it is an unauthorized error. If so, display appropriate message
            if (error.status == 401) {
                vm.isAuthorized = false;
            }
            else {
                // Another error occurred.
                vm.isAuthorized = true;
            }

        }

        /**
         * Convenience method to get comma separated list of task ids from multiLockedTasks
         * @returns {*}
         */
        vm.getSelectTaskIds = function () {
            if (vm.multiLockedTasks) {
                var data = vm.multiLockedTasks;
                var tasks = data.map(function (task) {
                    return task.taskId;
                });
                return tasks.join(',');
            }
            return null;
        }

        /**
         * Higlights the set of tasks on the map
         * @param doneTasks
         */
        vm.contributerHighlight = function (doneTasks) {
            // get an array of the 'done' task id's that have been clicked
            var doneTaskIds = doneTasks.tasks.map(function (task) {
                return task.taskId;
            });
            //highlight features
            var features = taskService.getTaskFeaturesByIds(vm.taskVectorLayer.getSource().getFeatures(), doneTaskIds);
            vm.highlightVectorLayer.getSource().addFeatures(features);
        }

        /**
         * Locks the set of tasks for validation
         * @param doneTasks
         */
        vm.contributorClick = function (doneTasks) {
            select.getFeatures().clear();

            // get an array of the 'done' task id's that have been clicked
            var doneTaskIds = doneTasks.tasks.map(function (task) {
                return task.taskId;
            });

            //use doneTaskIds to get corresponding subset of tasks for selection from the project
            var tasksForSelection = vm.projectData.tasks.features.filter(function (task) {
                if (doneTaskIds.includes(task.properties.taskId)) {
                    return task;
                }
            });

            //select each one by one
            tasksForSelection.forEach(function (feature) {
                var feature = taskService.getTaskFeatureById(vm.taskVectorLayer.getSource().getFeatures(), feature.properties.taskId);
                select.getFeatures().push(feature);
            });

            //TODO: put the UI in to locked for multi validation mode
            var lockPromise = taskService.lockTasksValidation(vm.projectData.projectId, doneTaskIds);
            lockPromise.then(function (tasks) {
                // refresh the project, to ensure we catch up with any status changes that have happened meantime
                // on the server
                refreshProject(vm.projectData.projectId);
                vm.currentTab = 'validation';
                vm.validatingStep = 'multi-locked';
                vm.multiSelectedTasksData = tasks;
                vm.multiLockedTasks = tasks;
                vm.selectedTaskData = null;
                vm.lockedTaskData = null
                vm.isSelectedValidatable = true;
                vm.taskError = '';
                vm.taskLockError = false;

            }, function (error) {
                refreshProject(vm.projectData.projectId);
                vm.taskLockError = true;
                // Check if it is an unauthorized error. If so, display appropriate message
                if (error.status == 401) {
                    vm.isAuthorized = false;
                }
                else {
                    // Another error occurred.
                    vm.isAuthorized = true;
                    vm.taskLockErrorMessage = error.data.Error;
                }
            });
        }
    }
})
();
