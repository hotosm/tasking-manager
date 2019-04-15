(function () {

    'use strict';

    /**
     * Project controller which manages activating a project the UI for user task selection and contribution
     * TODO: refactor this controller. It is getting big!
     */
    angular
        .module('taskingManager')
        .controller('projectController', ['$timeout', '$interval', '$scope', '$location', '$routeParams', '$window', '$q', 'moment', 'configService', 'mapService', 'projectService', 'styleService', 'taskService', 'geospatialService', 'editorService', 'authService', 'accountService', 'userService', 'licenseService', 'messageService', 'drawService', 'languageService', 'userPreferencesService', projectController]);

    function projectController($timeout, $interval, $scope, $location, $routeParams, $window, $q, moment, configService, mapService, projectService, styleService, taskService, geospatialService, editorService, authService, accountService, userService, licenseService, messageService, drawService, languageService, userPreferencesService) {
        var vm = this;
        vm.id = 0;
        vm.loaded = false;
        vm.projectData = null;
        vm.taskVectorLayer = null;
        vm.highlightVectorLayer = null;
        vm.lockedByCurrentUserVectorLayer = null;
        vm.map = null;
        vm.user = null;
        vm.maxlengthComment = configService.maxCommentLength;
        vm.taskUrl = '';

        // tab and view control
        vm.currentTab = '';
        vm.mappingStep = '';
        vm.validatingStep = '';
        vm.userCanMap = true;
        vm.userCanValidate = true;

        //error control
        vm.taskErrorMapping = '';
        vm.taskErrorValidation = '';
        vm.taskLockError = false;
        vm.taskLockErrorMessage = '';
        vm.taskUnLockError = false;
        vm.taskUnLockErrorMessage = '';
        vm.taskSplitError = false;
        vm.taskSplitCode == null;
        vm.taskCommentError = false;
        vm.taskCommentErrorMessage = '';
        vm.wasAutoUnlocked = false;

        //authorization
        vm.isAuthorized = false;

        //status flags
        vm.isSelectedMappable = false;
        vm.isSelectedValidatable = false;

        //task data
        vm.selectedTaskData = null;
        vm.lockedTaskData = null;
        vm.lockTime = {};
        vm.multiSelectedTasksData = [];
        vm.multiLockedTasks = [];

        //editor
        vm.editorStartError = '';
        vm.selectedEditor = 'ideditor';

        //interaction
        vm.selectInteraction = null;

        vm.mappedTasksPerUser = [];
        vm.lockedTasksForCurrentUser = [];

        //bound from the html
        vm.comment = '';
        vm.suggestedUsers = [];

        //table sorting control
        vm.propertyName = 'username';
        vm.reverse = true;

        // License
        vm.showLicenseModal = false;
        vm.lockingReason = '';

        // Augmented diff or attic query selection
        vm.selectedItem = null;

        //interval timer promise for autorefresh
        var autoRefresh = undefined;

        // Watch the languageService for change in language and get the project again when needed
        $scope.$watch(function () {
            return languageService.getLanguageCode();
        }, function () {
            updateDescriptionAndInstructions(vm.id);
        }, true);

        activate();

        function activate() {

            vm.currentTab = 'instructions';
            vm.mappingStep = 'selecting';
            vm.validatingStep = 'selecting';
            vm.selectedEditor = 'ideditor'; // default to iD editor
            mapService.createOSMMap('map');
            mapService.addOverviewMap();
            vm.map = mapService.getOSMMap();
            vm.loaded = false;
            vm.id = $routeParams.id;
            vm.highlightHistory = $routeParams.history ? parseInt($routeParams.history, 10) : null;

            updateMappedTaskPerUser(vm.id);

            // Check the user's role and initialise project after the async call has finished
            var session = authService.getSession();
            if (session && session.username && session.username != "") {
                var resultsPromise = accountService.getUser(session.username);
                resultsPromise.then(function (user) {
                    vm.user = user;
                    initialiseProject(vm.id);
                }, function () {
                    initialiseProject(vm.id);
                });
            }
            else {
                initialiseProject(vm.id);
            }

            var tab = $location.search().tab;
            if (tab === 'chat') {
                vm.currentTab = 'chat';
            }

            //start up a timer for autorefreshing the project.
            autoRefresh = $interval(function () {
                refreshAbbreviatedProject(vm.id);
                updateMappedTaskPerUser(vm.id);
                //TODO do a selected task refresh too
            }, 10000);

            // set up the preferred editor from user preferences
            vm.selectedEditor = userPreferencesService.getFavouriteEditor();
        }

        // listen for navigation away from the page event and stop the autrefresh timer
        $scope.$on('$routeChangeStart', function () {
            if (angular.isDefined(autoRefresh)) {
                $interval.cancel(autoRefresh);
                autoRefresh = undefined;
            }
        });


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
         * convenience method to reset task data controller properties
         */
        vm.resetTaskData = function () {
            vm.selectedTaskData = null;
            vm.lockedTaskData = null;
            vm.multiSelectedTasksData = [];
            vm.multiLockedTasks = [];
            vm.lockedTasksForCurrentUser = [];
        };

        vm.updatePreferedEditor = function () {
            userPreferencesService.setFavouriteEditor(vm.selectedEditor);
        };

        /**
         * Reset the user's selected editor back to the default
         */
        vm.resetSelectedEditor = function() {
          vm.selectedEditor = 'ideditor';
          vm.editorStartError = '';
        };

        /**
         * convenience method to reset task status controller properties
         */
        vm.resetStatusFlags = function () {
            vm.isSelectedMappable = false;
            vm.isSelectedValidatable = false;
        };

        /**
         * convenience method to reset error controller properties
         */
        vm.resetErrors = function () {
            vm.taskErrorMapping = '';
            vm.taskErrorValidation = '';
            vm.taskLockError = false;
            vm.taskLockErrorMessage = '';
            vm.taskUnLockError = false;
            vm.taskUnLockErrorMessage = '';
            vm.taskSplitError = false;
            vm.taskSplitCode == null;
            vm.taskUndoError = false;
            vm.taskCommentError = false;
            vm.taskCommentErrorMessage = '';
            vm.wasAutoUnlocked = false;
        };

        /**
         * Make the passed in feature the selected feature and ensure view and map updates for selected feature
         * @param feature - ol.Feature the feature to be selected
         */
        function selectFeature(feature) {
            vm.selectInteraction.getFeatures().clear();
            vm.selectInteraction.getFeatures().push(feature);
            onTaskSelection(feature);
        }

        /**
         * Sets up a randomly selected task as the currently selected task
         */
        vm.selectRandomTaskMap = function () {
            var feature = taskService.getRandomMappableTaskFeature(vm.taskVectorLayer.getSource().getFeatures());

            if (feature) {
                selectFeature(feature);
                var padding = getPaddingSize();
                vm.map.getView().fit(feature.getGeometry().getExtent(), {padding: [padding, padding, padding, padding]});
            }
            else {
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                vm.taskErrorMapping = 'none-available';
                vm.mappingStep = 'selecting';
                vm.validatingStep = 'selecting';
            }
        };

        vm.selectRandomTaskValidate = function () {
            var feature = taskService.getRandomTaskFeatureForValidation(vm.taskVectorLayer.getSource().getFeatures());

            if (feature) {
                selectFeature(feature);
                var padding = getPaddingSize();
                vm.map.getView().fit(feature.getGeometry().getExtent(), {padding: [padding, padding, padding, padding]});
            }
            else {
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                vm.taskErrorValidation = 'none-available';
                vm.mappingStep = 'selecting';
                vm.validatingStep = 'selecting';
            }
        };

        /**
         * Select tasks to validate by letting the user draw a polygon
         */
        vm.selectByPolygonValidate = function () {
            if (vm.drawPolygonInteraction.getActive()) {
                drawService.getSource().clear();
                vm.selectInteraction.setActive(true);
                vm.drawPolygonInteraction.setActive(false);
            }
            else {
                vm.selectInteraction.setActive(false);
                vm.drawPolygonInteraction.setActive(true);
            }
        };

        /**
         * Add stand-alone comment, adding it to task history.
         */
        vm.addStandaloneComment = function() {
            var projectId = vm.projectData.projectId;
            var taskId = vm.selectedTaskData.taskId;
            var commentPromise = taskService.addTaskComment(projectId, taskId, vm.comment);
            commentPromise.then(function (data) {
                vm.comment = '';
                vm.resetErrors();
                setUpSelectedTask(data);
            }, function (error) {
                vm.taskCommentError = true;
                vm.taskCommentErrorMessage = error.data.Error;
            });
        };

        /**
         * Add the interactions for selecting tasks
         */
        function addInteractions() {

            // Priority areas: initialise the draw service with interactions
            drawService.initInteractions(true, false, false, false, false, false);

            // Get the interactions in the controller so events can be handled
            vm.source = drawService.getSource();
            // Draw interaction - adds it to the map in the draw service
            vm.drawPolygonInteraction = drawService.getDrawPolygonInteraction();
            // Select interaction
            vm.selectInteraction = new ol.interaction.Select({
                style: styleService.getSelectedTaskStyle,
                layers: [vm.taskVectorLayer]
            });
            vm.map.addInteraction(vm.selectInteraction);
            vm.selectInteraction.on('select', function (event) {
                $scope.$apply(function () {
                    var feature = event.selected[0];
                    onTaskSelection(feature);
                });
            });

            vm.drawPolygonInteraction.on('drawstart', function () {
                drawService.getSource().clear();
            });
            // Check which tasks intersect and add them to the selected features manually
            vm.drawPolygonInteraction.on('drawend', function (event) {
                var selectedFeatures = vm.selectInteraction.getFeatures();
                selectedFeatures.clear();
                var polygon = event.feature.getGeometry();
                var features = vm.taskVectorLayer.getSource().getFeatures();
                vm.selectedTasksForValidation = [];
                for (var i = 0; i < features.length; i++) {
                    if (polygon.intersectsExtent(features[i].getGeometry().getExtent())) {
                        var taskStatus = features[i].getProperties().taskStatus;
                        if (taskStatus === 'MAPPED' || taskStatus === 'VALIDATED') {
                            selectedFeatures.push(features[i]);
                            vm.selectedTasksForValidation.push(features[i].getProperties().taskId);
                        }
                    }
                }
                // Reactivate select after 300ms (to avoid single click trigger)
                $timeout(function () {
                    vm.selectInteraction.setActive(true);
                    vm.drawPolygonInteraction.setActive(false);
                    drawService.getSource().clear();
                }, 300);
            });
        }

        /**
         * clears the currently selected task.  Clears down/resets the vm properties and clears the feature param in the select interaction object.
         */
        vm.clearCurrentSelection = function () {
            // vm.mappingStep = 'selecting';
            // vm.validatingStep = 'selecting';
            vm.selectInteraction.getFeatures().clear();
        };

        /**
         * Undo task status change
         */
        vm.undo = function(){
            vm.taskUndoError = false;
            var projectId = vm.projectData.projectId;
            var taskId = vm.selectedTaskData.taskId;
            var resultsPromise = taskService.undo(projectId, taskId);
            resultsPromise.then(function (data) {
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                setUpSelectedTask(data);
                refreshProject(vm.projectData.projectId);
            }, function (error) {
                // TODO - show message
                vm.taskUndoError = true;
            });
        };

        vm.getLockTime = function() {
            var task = null;
            if (vm.selectedTaskData) {
                task = vm.selectedTaskData;
            }
            else if (vm.multiSelectedTasksData) {
                task = vm.multiSelectedTasksData[0];
            }
            if (task != null && task.taskId in vm.lockTime) {
                var lockTime = moment.utc(vm.lockTime[task.taskId]);
                var diffTime = lockTime.add(task.autoUnlockSeconds, 'seconds').diff(moment.utc(), 'minutes');
                var eventDuration = diffTime
                var eventDurationString = ''
                var eventMDuration = moment.duration(eventDuration, 'minutes');
                var days = eventMDuration.days()
                var hours = eventMDuration.hours()
                var minutes = eventMDuration.minutes()
                eventDurationString = ""
                if (days > 0)
                {
                    if (days === 1){
                        eventDurationString += " " + days + ' day'  
                    } else {
                        eventDurationString += " " + days + ' days'
                    }
                } 
                if (hours > 0)
                {
                    if (hours === 1){
                        eventDurationString += " " + hours + ' hour'  
                    } else {
                        eventDurationString += " " + hours + ' hours'
                    }
                } 
                if (minutes > 0)
                {
                    if (minutes === 1){
                        eventDurationString += " " + minutes + ' minute'  
                    } else {
                        eventDurationString += " " + minutes + ' minutes'
                    }
                }
                return eventDurationString
            }
            else {
                return null;
            }
        };

        /**
         * Initilaise a project using it's id
         * @param id - id of the project to initialise
         */
        function initialiseProject(id) {
            vm.errorGetProject = false;
            var resultsPromise = projectService.getProject(id, false);
            resultsPromise.then(function (data) {
                //project returned successfully
                vm.loaded = true;
                vm.projectData = data;
                vm.userCanMap = vm.user && projectService.userCanMapProject(vm.user.mappingLevel, vm.projectData.mapperLevel, vm.projectData.enforceMapperLevel);
                vm.userCanValidate = vm.user && projectService.userCanValidateProject(vm.user.role, vm.projectData.enforceValidatorRole);
                addAoiToMap(vm.projectData.areaOfInterest);
                addPriorityAreasToMap(vm.projectData.priorityAreas);
                addProjectTasksToMap(vm.projectData.tasks, true);
                // Add OpenLayers interactions
                addInteractions();

                //add a layer for users locked tasks
                if (!vm.lockedByCurrentUserVectorLayer) {
                    var source = new ol.source.Vector();
                    vm.lockedByCurrentUserVectorLayer = new ol.layer.Vector({
                        source: source,
                        name: 'lockedByCurrentUser',
                        style: styleService.getLockedByCurrentUserTaskStyle
                    });
                    vm.map.addLayer(vm.lockedByCurrentUserVectorLayer);
                } else {
                    vm.lockedByCurrentUserVectorLayer.getSource().clear();
                }

                //add a layer for task highlighting
                if (!vm.highlightVectorLayer) {
                    var source = new ol.source.Vector();
                    vm.highlightVectorLayer = new ol.layer.Vector({
                        source: source,
                        name: 'highlight',
                        style: styleService.getHighlightedTaskStyle
                    });
                    vm.map.addLayer(vm.highlightVectorLayer);
                } else {
                    vm.highlightVectorLayer.getSource().clear();
                }

                if ($location.search().task) {
                    selectTaskById($location.search().task);
                }
            }, function () {
                // project not returned successfully
                vm.loaded = true;
                vm.errorGetProject = true;
            });
        }

        /**
         * Update description and metadata
         * @param id
         */
        function updateDescriptionAndInstructions(id) {
            vm.errorGetProject = false;
            var resultsPromise = projectService.getProject(id, false);
            resultsPromise.then(function (data) {
                vm.projectData = data;
            }, function () {
                // project not returned successfully
                vm.errorGetProject = true;
            });
        }

        /**
         * Gets project data from server and updates the map
         * @param id - id of project to be refreshed
         */
        function refreshProject(id) {
            vm.errorGetProject = false;
            var resultsPromise = projectService.getProject(id, false);
            resultsPromise.then(function (data) {
                //project returned successfully
                vm.errorGetProject = false;
                vm.projectData = data;
                addProjectTasksToMap(vm.projectData.tasks, false);
                //TODO: move the selected task refresh to a separate function so it can be called separately
                if (vm.selectedTaskData) {
                    var selectedFeature = taskService.getTaskFeatureById(vm.taskVectorLayer.getSource().getFeatures(), vm.selectedTaskData.taskId);
                    //this just forces the selected styling to apply
                    vm.selectInteraction.getFeatures().clear();
                    vm.selectInteraction.getFeatures().push(selectedFeature);
                }
                else if (vm.multiSelectedTasksData.length > 0) {
                    var tasks = vm.multiSelectedTasksData.map(function (task) {
                        return task.taskId;
                    });
                    var selectedFeatures = taskService.getTaskFeaturesByIds(vm.taskVectorLayer.getSource().getFeatures(), tasks);
                    vm.selectInteraction.getFeatures().clear();
                    selectedFeatures.forEach(function (feature) {
                            vm.selectInteraction.getFeatures().push(feature);
                        }
                    );
                }

            }, function () {
                // project not returned successfully
                vm.errorGetProject = true;
            });
        }

        /**
         * Gets abbreviated project data from server and updates the map
         * @param id - id of project to be refreshed
         */
        function refreshAbbreviatedProject(id) {
            vm.errorGetProject = false;
            var resultsPromise = projectService.getProject(id, true);
            resultsPromise.then(function (data) {
                //project returned successfully
                if (vm.projectData.tasks.features.length == data.tasks.features.length) {
                    // length of tasks is the same; we can assume only states changed
                    var source = vm.taskVectorLayer.getSource();
                    var features = source.getFeatures();
                    updateProjectTasksOnMap(features, data.tasks);
                } else {
                    // length of tasks has changed since last update; likely a split occurred.
                    // fall back to full update
                    refreshProject(id);
                }

            }, function () {
               // project not returned successfully
               vm.errorGetProject = true;
            });
        }

        /**
         * Select a task using its ID.
         * @param taskId
         */
        function selectTaskById(taskId) {
            //select task on map if id provided in url
            var task = taskService.getTaskFeatureById(vm.taskVectorLayer.getSource().getFeatures(), taskId);
            if (task) {
                selectFeature(task);
                var padding = getPaddingSize();
                vm.map.getView().fit(task.getGeometry().getExtent(), {padding: [padding, padding, padding, padding]});
            }
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
                    style: styleService.getTaskStyle
                });
                vm.map.addLayer(vm.taskVectorLayer);

                // change mouse cursor when over vector feature
                vm.map.on('pointermove', function (e) {
                    var pixel = vm.map.getEventPixel(e.originalEvent);
                    var hit = vm.map.hasFeatureAtPixel(pixel, {
                        layerFilter: function (layerCandidate) {
                            return layerCandidate == vm.taskVectorLayer;
                        }
                    });
                    vm.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
                });
            } else {
                source = vm.taskVectorLayer.getSource();
                source.clear();
            }

            var taskFeatures = geospatialService.getFeaturesFromGeoJSON(tasks);
            source.addFeatures(taskFeatures);

            //add locked tasks to the locked tasks vector layer
            var projectId = vm.projectData.projectId;
            if (authService.isUserLoggedIn()) {
                updateLockedTasksForCurrentUser(projectId);
            }

            if (fitToProject) {
                vm.map.getView().fit(source.getExtent());
            }
        }

        /**
         * Updates the map task properties (colors, locked status)
         * @param oldTasks
         * @param newTasks
         */
        function updateProjectTasksOnMap(oldTasks, newTasks) {
            var newFeatures = geospatialService.getFeaturesFromGeoJSON(newTasks);

            for (var i=0; i < newFeatures.length; i++) {
                var feature = taskService.getTaskFeatureById(oldTasks, newFeatures[i].getProperties()['taskId']);
                feature.setProperties({"taskStatus": newFeatures[i].getProperties()['taskStatus']});
            }
            // for each task in features, update source
        }

        /**
         * Updates the data for mapped tasks by user
         * @param projectId
         */
        function updateMappedTaskPerUser(projectId) {
            var mappedTasksByUserPromise = taskService.getMappedTasksByUser(projectId);
            mappedTasksByUserPromise.then(function (data) {
                vm.mappedTasksPerUser = data.mappedTasks;
            }, function () {
                vm.mappedTasksPerUser = [];
            });
        }

        /**
         * Updates the map and controller data for tasks locked by current user
         * @param projectId
         */
        function updateLockedTasksForCurrentUser(projectId) {
            var lockedTasksPromise = taskService.getLockedTasksForCurrentUser(projectId);
            lockedTasksPromise.then(function (lockedTasks) {
                vm.lockedTasksForCurrentUser = lockedTasks;
                vm.lockedByCurrentUserVectorLayer.getSource().clear();
                if (vm.lockedTasksForCurrentUser.length > 0) {
                    var features = taskService.getTaskFeaturesByIds(vm.taskVectorLayer.getSource().getFeatures(), vm.lockedTasksForCurrentUser);
                    vm.lockedByCurrentUserVectorLayer.getSource().addFeatures(features);
                }
            }, function () {
                if (vm.lockedByCurrentUserVectorLayer) {
                    vm.lockedByCurrentUserVectorLayer.getSource().clear();
                }
                vm.lockedTasksForCurrentUser = [];
                if (vm.mappingStep === 'locked' || vm.validatingStep === 'locked') {
                    vm.mappingStep = 'viewing';
                    vm.validatingStep = 'viewing';
                    vm.wasAutoUnlocked = true;
                }
            });
        }

        function getLastLockedAction(task) {
            var mostRecentAction = task.taskHistory[0];
            task.taskHistory.forEach(function(action) {
                if (action.actionDate > mostRecentAction.actionDate) {
                    mostRecentAction = action;
                }
            });
            return mostRecentAction;
        }

        /**
         * Has the current user got tasks locked for mapping
         * @returns {boolean}
         */
        vm.hasTaskLockedForMapping = function () {
            if (vm.taskVectorLayer) {
                var lockedFeatures = taskService.getTaskFeaturesByIdAndStatus(vm.taskVectorLayer.getSource().getFeatures(), vm.lockedTasksForCurrentUser, 'LOCKED_FOR_MAPPING');
                return lockedFeatures.length == 1;
            }

        };

        /**
         * Reselect tasks user has locked for mapping
         */
        vm.reselectTaskForMapping = function () {
            if (vm.taskVectorLayer) {
                var lockedFeatures = taskService.getTaskFeaturesByIdAndStatus(vm.taskVectorLayer.getSource().getFeatures(), vm.lockedTasksForCurrentUser, 'LOCKED_FOR_MAPPING');
                if (lockedFeatures.length == 1) {
                    selectFeature(lockedFeatures[0]);
                    onTaskSelection(lockedFeatures[0]);
                    var padding = getPaddingSize();
                    vm.map.getView().fit(lockedFeatures[0].getGeometry().getExtent(), {padding: [padding, padding, padding, padding]});
                }
            }

        };

        /**
         * Has the current user got tasks locked for validation
         * @returns {boolean}
         */
        vm.hasTasksLockedForValidation = function () {
            if (vm.taskVectorLayer) {
                var lockedFeatures = taskService.getTaskFeaturesByIdAndStatus(vm.taskVectorLayer.getSource().getFeatures(), vm.lockedTasksForCurrentUser, 'LOCKED_FOR_VALIDATION');
                return lockedFeatures.length > 0;
            }
        };

        /**
         * Reselect tasks user has locked for validation
         */
        vm.reselectTasksForValidation = function () {
            if (vm.taskVectorLayer) {
                var lockedFeatures = taskService.getTaskFeaturesByIdAndStatus(vm.taskVectorLayer.getSource().getFeatures(), vm.lockedTasksForCurrentUser, 'LOCKED_FOR_VALIDATION');
                if (lockedFeatures.length == 1) {
                    selectFeature(lockedFeatures[0]);
                    onTaskSelection(lockedFeatures[0]);
                    var padding = getPaddingSize();
                    vm.map.getView().fit(lockedFeatures[0].getGeometry().getExtent(), {padding: [padding, padding, padding, padding]});
                }
                else if (lockedFeatures.length > 1) {

                    vm.selectInteraction.getFeatures().clear();

                    //select each one by one
                    lockedFeatures.forEach(function (feature) {
                        vm.selectInteraction.getFeatures().push(feature);
                    });

                    var extent = geospatialService.getBoundingExtentFromFeatures(lockedFeatures);
                    // Zoom to the extent to get the right zoom level for the editorsgit commit -a
                    vm.map.getView().fit(extent);

                    //put the UI in to locked for multi validation mode
                    var lockPromise = taskService.getLockedTaskDetailsForCurrentUser(vm.projectData.projectId);
                    lockPromise.then(function (tasks) {

                        // Filter to get the ones locked for validation
                        var tasksLockedForValidation = tasks.filter(function (task) {
                            if (task.taskStatus == 'LOCKED_FOR_VALIDATION'){
                                return task;
                            }
                        });

                        // refresh the project, to ensure we catch up with any status changes that have happened meantime
                        // on the server
                        // TODO - The following reset lines are repeated in several places in this file.
                        // Refactoring to a single function call was considered, however it was decided that the ability to
                        // call the resets individually was desirable and would help readability.
                        // The downside is that any change will have to be replicated in several places.
                        // A fundamental refactor of this controller should be considered at some stage.
                        vm.resetErrors();
                        vm.resetStatusFlags();
                        vm.resetTaskData();
                        vm.currentTab = 'validation';
                        vm.validatingStep = 'multi-locked';
                        vm.multiSelectedTasksData = tasksLockedForValidation;
                        vm.multiLockedTasks = tasksLockedForValidation;
                        vm.isSelectedValidatable = true;

                    }, function (error) {
                        // TODO - handle error
                    });
                }
            }
        };


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
            var aoiFeature = geospatialService.getFeatureFromGeoJSON(aoi);
            source.addFeature(aoiFeature);
        }

        /**
         * Adds the priority areas to the map
         * @param priorityAreas
         */
        function addPriorityAreasToMap(priorityAreas) {
            var source = new ol.source.Vector();
            var vector = new ol.layer.Vector({
                source: source,
                name: 'priorityareas'
            });
            vm.map.addLayer(vector);

            source.on('addfeature', function (event) {
                // Add style to make it stand out from the AOI
                var style = new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255,0,0,0.2)' //red
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(255,0,0,1)', //red
                        width: 1
                    })
                });
                event.feature.setStyle(style);
            });
            if (priorityAreas) {
                for (var i = 0; i < priorityAreas.length; i++) {
                    var feature = geospatialService.getFeatureFromGeoJSON(priorityAreas[i]);
                    source.addFeature(feature);
                }
                if (priorityAreas.length > 0) {
                    vm.hasPriorityArea = true;
                }
            }
        }

        /**
         * Gets a task from the server and sets up the task returned as the currently selected task
         * @param feature
         */
        function onTaskSelection(feature) {

            //if no feature has been clicked on, go to unselected more
            if (!feature) {
                vm.selectedTaskData = null;
                vm.lockedTaskData = null;
                vm.multiSelectedTasksData = [];
                vm.multiLockedTasks = [];
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.clearCurrentSelection();
                vm.mappingStep = 'selecting';
                vm.validatingStep = 'selecting';
                return;
            }

            //we don't want to allow selection of multiple features by map click
            //get id from feature
            var taskId = feature.get('taskId');
            var projectId = vm.projectData.projectId;

            // get full task from task service call
            var taskPromise = taskService.getTask(projectId, taskId);
            taskPromise.then(function (data) {
                //task returned successfully
                //reset task errors
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.selectedTaskData = null;
                vm.lockedTaskData = null;
                vm.multiSelectedTasksData = [];
                vm.multiLockedTasks = [];
                setUpSelectedTask(data);
                // TODO: This is a bit icky.  Need to find something better.  Maybe when roles are in place.
                // Need to make a decision on what tab to go to if user has clicked map but is not on mapping or validating
                // tab
                if (vm.currentTab === 'description' || vm.currentTab === 'instructions') {
                    //prioritise validation
                    vm.currentTab = vm.isSelectedValidatable ? 'validation' : 'mapping';
                }

            }, function () {
                // task not returned successfully
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a sinhle function call was cinsidered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                vm.taskErrorMapping = 'task-get-error';
                vm.taskErrorValidation = 'task-get-error';
                vm.mappingStep = 'selecting';
                vm.validatingStep = 'selecting';
                if (vm.currentTab === 'description' || vm.currentTab !== 'instructions') {
                    //prioritise mapping
                    vm.currentTab = 'mapping';
                }
            });
        }

        vm.onShortCodeClick = function(event) {
            // If the link contains one or more OSM entities or a viewport for
            // the title, and the user has chosen JOSM as their editor, then try
            // loading them in JOSM instead of following the link.
            //
            // Use of the title attribute is a hack, but the sanitizer allows it
            // through and it's important these comments get properly sanitized.
            if (event.target.tagName === 'A' && vm.selectedEditor === 'josm') {
                var title = event.target.getAttribute("title");
                var editorCommand = null;
                var params = null;

                if (/^((^|, )(way|node|relation) \d+)+$/.test(title)) {
                    editorCommand = 'http://127.0.0.1:8111/load_object';
                    params = vm.osmEntityJOSMParams(title);
                }
                else if (/^viewport \d+\/-?[.\d]+\/-?[.\d]+/.test(title)) {
                    editorCommand = 'http://127.0.0.1:8111/zoom';
                    params = vm.osmViewportJOSMParams(title);
                }

                if (editorCommand) {
                    editorService.sendJOSMCmd(editorCommand, params).catch(function() {
                        //warn that JSOM couldn't be contacted
                        vm.editorStartError = 'josm-error';
                    });

                    event.preventDefault();
                    return false;
                }
            }
        };

        vm.osmEntityJOSMParams = function(linkTitle) {
            return {
                objects: linkTitle.replace(/ /g, ''),
                new_layer: 'true',
                layer_name: linkTitle,
            };
        };

        vm.osmViewportJOSMParams = function(linkTitle) {
            // parse the zoom/lat/lon values that come after the space
            var values = linkTitle.split(' ')[1].split('/');
            var zoom = parseInt(values[0], 10);
            var lat = parseFloat(values[1]);
            var lon = parseFloat(values[2]);

            var params = vm.josmBBoxFromViewport(zoom, lat, lon);
            params.new_layer = 'true';
            params.layer_name = linkTitle;

            return params;
        };

        /**
         * Sets up the view model for the task options and actions for passed in task data object.
         * @param data - task JSON data object
         */
        function setUpSelectedTask(data) {
            var isLockedByMeMapping = data.taskStatus === 'LOCKED_FOR_MAPPING' && data.lockHolder === vm.user.username;
            var isLockedByMeValidation = data.taskStatus === 'LOCKED_FOR_VALIDATION' && data.lockHolder === vm.user.username;
            vm.isSelectedMappable = (isLockedByMeMapping || data.taskStatus === 'READY' || data.taskStatus === 'INVALIDATED');
            vm.isSelectedValidatable = (isLockedByMeValidation || data.taskStatus === 'MAPPED' || data.taskStatus === 'VALIDATED' || data.taskStatus === 'BADIMAGERY');
            vm.selectedTaskData = data;

            formatHistoryComments(vm.selectedTaskData.taskHistory);

            //jump to locked step if mappable and locked by me
            if (isLockedByMeMapping) {
                vm.mappingStep = 'locked';
                vm.lockedTaskData = data;
                vm.currentTab = 'mapping';
                vm.lockTime[vm.selectedTaskData.taskId] = getLastLockedAction(vm.lockedTaskData).actionDate;
            }
            else {
                vm.mappingStep = 'viewing';
            }

            //jump to validatable step if validatable and locked by me
            if (isLockedByMeValidation) {
                vm.validatingStep = 'locked';
                vm.lockedTaskData = data;
                vm.currentTab = 'validation';
                vm.lockTime[vm.selectedTaskData.taskId] = getLastLockedAction(vm.lockedTaskData).actionDate;
            }
            else {
                vm.validatingStep = 'viewing';
            }

            //update browser address bar with task id search params
            $location.search('task', data.taskId);
        }

        /**
         * Format a task comment by linking usernames and short codes
         */
        vm.formattedComment = function(commentText) {
            return messageService.formatShortCodes(commentText);
        };

        /**
         * Format all task history comments by linking usernames and short codes
         */
        function formatHistoryComments(taskHistory) {
            if (taskHistory) {
                for (var i = 0; i < taskHistory.length; i++) {
                    taskHistory[i].actionText = vm.formattedComment(taskHistory[i].actionText);
                }
            }
        }

        /**
         * Get the full URL for the social media widget
         * @returns {*}
         */
        vm.getSocialMediaUrl = function () {
            return $location.absUrl();
        };

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
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                refreshProject(projectId);
                updateMappedTaskPerUser(projectId);
                vm.clearCurrentSelection();
                vm.mappingStep = 'selecting';
                vm.validatingStep = 'selecting';

            }, function (error) {
                onUnLockError(projectId, error);
            });
        };

        /**
         * Call api to stop mapping currebtly locked task.  Will pass the comment to api.  Will update view and map after unlock.
         * @param comment
         */
        vm.stopMapping = function (comment) {
            var projectId = vm.projectData.projectId;
            var taskId = vm.lockedTaskData.taskId;
            var stopPromise = taskService.stopMapping(projectId, taskId, comment);
            vm.comment = '';
            stopPromise.then(function (data) {
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                refreshProject(projectId);
                updateMappedTaskPerUser(projectId);
                vm.clearCurrentSelection();
                vm.mappingStep = 'selecting';
                vm.validatingStep = 'selecting';

            }, function (error) {
                onUnLockError(projectId, error);
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
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                refreshProject(projectId);
                updateMappedTaskPerUser(projectId);
                vm.clearCurrentSelection();
                vm.mappingStep = 'selecting';
                vm.validatingStep = 'selecting';
            }, function (error) {
                onUnLockError(projectId, error);
            });
        };

        /**
         * Call api to stop validating locked task.  Will pass the comment to api.  Will update view and map after unlock.
         * @param comment
         */
        vm.stopValidating = function (comment) {
            var projectId = vm.projectData.projectId;
            var taskId = vm.lockedTaskData.taskId;
            var tasks = [{
                comment: comment,
                taskId: taskId
            }];
            var unLockPromise = taskService.stopValidating(projectId, tasks);
            vm.comment = '';
            unLockPromise.then(function (data) {
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                refreshProject(projectId);
                updateMappedTaskPerUser(projectId);
                vm.clearCurrentSelection();
                vm.mappingStep = 'selecting';
                vm.validatingStep = 'selecting';
            }, function (error) {
                onUnLockError(projectId, error);
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
                    status: status,
                    taskId: task.taskId
                };
            });

            vm.resetErrors();
            vm.resetStatusFlags();
            vm.resetTaskData();

            var stopPromise = taskService.unLockTaskValidation(projectId, tasks);
            vm.comment = '';
            stopPromise.then(function (data) {
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                refreshProject(projectId);
                updateMappedTaskPerUser(projectId);
                vm.clearCurrentSelection();
                vm.mappingStep = 'selecting';
                vm.validatingStep = 'selecting';
            }, function (error) {
                onUnLockError(projectId, error);
            });
        };

        /**
         * Call api to stop validating currently locked tasks.  Will pass the comment to api.  Will update view and map after unlock.
         * @param comment
         */
        vm.stopMultiTaskValidation = function (comment) {
            var projectId = vm.projectData.projectId;

            var data = vm.multiLockedTasks;
            var tasks = data.map(function (task) {
                return {
                    comment: comment,
                    taskId: task.taskId
                };
            });

            vm.resetErrors();
            vm.resetStatusFlags();
            vm.resetTaskData();

            var stopPromise = taskService.stopValidating(projectId, tasks);
            vm.comment = '';
            stopPromise.then(function (data) {
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                refreshProject(projectId);
                updateMappedTaskPerUser(projectId);
                vm.clearCurrentSelection();
                vm.mappingStep = 'selecting';
                vm.validatingStep = 'selecting';
            }, function (error) {
                onUnLockError(projectId, error);
            });
        };

        /**
         * Call api to lock currently selected task for mapping.  Will update view and map after unlock.
         */
        vm.lockSelectedTaskMapping = function () {
            vm.lockingReason = 'MAPPING';
            var projectId = vm.projectData.projectId;
            var taskId = vm.selectedTaskData.taskId;
            // - try to lock the task, call returns a promise
            var lockPromise = taskService.lockTaskMapping(projectId, taskId);
            lockPromise.then(function (data) {
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                // refresh the project, to ensure we catch up with any status changes that have happened meantime
                // on the server
                refreshProject(projectId);
                updateMappedTaskPerUser(projectId);
                vm.currentTab = 'mapping';
                vm.mappingStep = 'locked';
                vm.selectedTaskData = data;
                vm.isSelectedMappable = true;
                vm.lockedTaskData = data;
                vm.lockTime[taskId] = getLastLockedAction(vm.lockedTaskData).actionDate;
                formatHistoryComments(vm.selectedTaskData.taskHistory);
            }, function (error) {
                onLockError(projectId, error);
            });
        };


        /**
         * Call api to split task currently selected task for mapping.  Will update view and map after split.
         */
        vm.splitTask = function () {
            vm.taskSplitError = false;
            vm.taskSplitCode == null;
            var projectId = vm.projectData.projectId;
            var taskId = vm.selectedTaskData.taskId;
            var splitPromise = taskService.splitTask(projectId, taskId);
            splitPromise.then(function (data) {
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                refreshProject(projectId);
                updateMappedTaskPerUser(projectId);
                vm.clearCurrentSelection();
                vm.mappingStep = 'selecting';
                vm.validatingStep = 'selecting';
                $location.search('task', null);

            }, function (error) {
                // TODO - show message
                vm.taskSplitError = true;
                vm.taskSplitCode = null;
                if (error.status = 403) {
                    vm.taskSplitCode = 403;
                }
            });
        };

        /**
         * Call api to lock currently selected task for validation.  Will update view and map after unlock.
         */
        vm.lockSelectedTaskValidation = function () {
            vm.lockingReason = 'VALIDATION';
            var projectId = vm.projectData.projectId;
            var taskId = vm.selectedTaskData.taskId;
            var taskIds = [taskId];
            // - try to lock the task, call returns a promise
            var lockPromise = taskService.lockTasksValidation(projectId, taskIds);
            lockPromise.then(function (tasks) {
                //TODO - The following reset lines are repeated in several places in this file.
                //Refactoring to a single function call was considered, however it was decided that the ability to
                //call the resets individually was desirable and would help readability.
                //The downside is that any change will have to be replicated in several places.
                //A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                // refresh the project, to ensure we catch up with any status changes that have happened meantime
                // on the server
                refreshProject(projectId);
                updateMappedTaskPerUser(projectId);
                vm.currentTab = 'validation';
                vm.validatingStep = 'locked';
                vm.selectedTaskData = tasks[0];
                vm.isSelectedValidatable = true;
                vm.lockedTaskData = tasks[0];
                vm.lockTime[taskId] = getLastLockedAction(vm.lockedTaskData).actionDate;
                formatHistoryComments(vm.selectedTaskData.taskHistory);
            }, function (error) {
                onLockError(projectId, error);
            });
        };

        vm.josmBBoxFromViewport = function(zoom, lat, lon) {
          // We also need a window width and height to limit the size of the
          // box. We use the current browser window dimensions as a proxy for
          // the JOSM window.
          var bbox = geoViewport.bounds([lon, lat], zoom, [$window.innerWidth, $window.innerHeight]);

          // Convert WSEN bbox to JOSM params
          return { left: bbox[0], right: bbox[2], top: bbox[3], bottom: bbox[1] };
        };

        /**
         * Get a basic bounding box for the selected task
         */
        vm.taskBBox = function() {
            var taskId = vm.selectedTaskData.taskId;
            var features = vm.taskVectorLayer.getSource().getFeatures();
            var selectedFeature = taskService.getTaskFeatureById(features, taskId);
            return selectedFeature.getGeometry().getExtent();
        }

        /**
         * Get the task bounding box, transforming the coordinates to WGS84.
         */
        vm.osmBBox = function() {
            return geospatialService.transformExtentToLatLonString(vm.taskBBox());
        }

        /**
         * View OSM changesets by getting the bounding box, transforming the coordinates to WGS84 and passing it to OSM
         */
        vm.viewOSMChangesets = function () {
            $window.open('http://www.openstreetmap.org/history?bbox=' + vm.osmBBox());
        };

        /**
         * View changes in Overpass Turbo
         */
        vm.viewOverpassTurbo = function () {
            var queryPrefix = '<osm-script output="json" timeout="25"><union>';
            var querySuffix = '</union><print mode="body"/><recurse type="down"/><print mode="skeleton" order="quadtile"/></osm-script>';
            var queryMiddle = '';

            // Get the bbox of the task
            var bboxArray = vm.overpassBBox();
            var bbox = 's="' + bboxArray[0] + '" w="' + bboxArray[1] + '" n="' + bboxArray[2] + '" e="' + bboxArray[3] + '"';

            // Add (bounded) work by participating users to query
            vm.participantUsernames().forEach(function(user) {
              queryMiddle = queryMiddle +
                  '<query type="node"><user name="' + user + '"/><bbox-query ' + bbox + '/></query>' +
                  '<query type="way"><user name="' + user + '"/><bbox-query ' + bbox + '/></query>' +
                  '<query type="relation"><user name="' + user + '"/><bbox-query ' + bbox + '/></query>';
            });

            var query = queryPrefix + queryMiddle + querySuffix;
            $window.open('http://overpass-turbo.eu/map.html?Q=' + encodeURIComponent(query));
        };

        /**
         * Start the editor by getting the editor options and the URL to call
         * @param editor
         */
        vm.startEditor = function (editor) {

            vm.editorStartError = '';

            var selectedFeatures = vm.selectInteraction.getFeatures();
            var taskCount = selectedFeatures.getArray().length;
            var extent = geospatialService.getBoundingExtentFromFeatures(selectedFeatures.getArray());
            // Zoom to the extent to get the right zoom level for the editorsgit commit -a
            vm.map.getView().fit(extent);
            var extentTransformed = geospatialService.transformExtentToLatLonArray(extent);
            var imageryUrl = vm.projectData.imagery;
            var changesetComment = vm.projectData.changesetComment;
            // get center in the right projection
            var center = ol.proj.transform(geospatialService.getCenterOfExtent(extent), 'EPSG:3857', 'EPSG:4326');
            if (editor === 'ideditor') {
                editorService.launchIdEditor(
                    center,
                    changesetComment,
                    imageryUrl,
                    vm.projectData.projectId,
                    vm.getSelectTaskIds()
                );
            }
            else if (editor === 'potlatch2') {
                editorService.launchPotlatch2Editor(center);
            }
            else if (editor === 'fieldpapers') {
                editorService.launchFieldPapersEditor(center);
            }
            else if (editor === 'josm') {

                if (taskCount > 1) {
                    // load a new empty layer in josm for task square(s).  This step required to get custom name for layer
                    // use empty, uri encoded osmxml with upload=never for the data para
                    var emptyTaskLayerParams = {
                        new_layer: true,
                        mime_type: encodeURIComponent('application/x-osm+xml'),
                        layer_name: encodeURIComponent('Task Boundaries #' + vm.projectData.projectId + '- Do not edit or upload'),
                        data: encodeURIComponent('<?xml version="1.0" encoding="utf8"?><osm generator="JOSM" upload="never" version="0.6"></osm>')
                    };
                    editorService.sendJOSMCmd('http://127.0.0.1:8111/load_data', emptyTaskLayerParams)
                        .catch(function() {
                            //warn that JSOM couldn't be started
                            vm.editorStartError = 'josm-error';
                        });

                    //load task square(s) into JOSM
                    var taskImportParams = {
                        url: editorService.getOSMXMLUrl(vm.projectData.projectId, vm.getSelectTaskIds()),
                        new_layer: false
                    };
                    editorService.sendJOSMCmd('http://127.0.0.1:8111/import', taskImportParams)
                        .catch(function() {
                            //warn that JSOM couldn't be started
                            vm.editorStartError = 'josm-error';
                        });
                }

                //load aerial photography if present
                var changesetSource = "Bing";
                var hasImagery = false;
                if (imageryUrl && typeof imageryUrl != "undefined" && imageryUrl !== '') {
                    changesetSource = imageryUrl;
                    hasImagery = true;
                }
                if (hasImagery) {
                    var imageryParams = {
                        title: encodeURIComponent('Tasking Manager Imagery - #' + vm.projectData.projectId),
                        type: imageryUrl.toLowerCase().substring(0, 3),
                        url: encodeURIComponent(imageryUrl)
                    };
                    editorService.sendJOSMCmd('http://127.0.0.1:8111/imagery', imageryParams)
                        .catch(function() {
                            //warn that imagery couldn't be loaded
                            vm.editorStartError = 'josm-imagery-error';
                        });
                }

                // load a new empty layer in josm for osm data, this step necessary to have a custom name for the layer
                // use empty, uri encoded osmxml for the data param
                var emptyOSMLayerParams = {
                    new_layer: true,
                    mime_type: 'application/x-osm+xml',
                    layer_name: 'OSM Data',
                    data: encodeURIComponent('<?xml version="1.0" encoding="utf8"?><osm generator="JOSM" version="0.6"></osm>')
                }
                editorService.sendJOSMCmd('http://127.0.0.1:8111/load_data', emptyOSMLayerParams)
                    .catch(function() {
                        //warn that JSOM couldn't be started
                        vm.editorStartError = 'josm-error';
                    });

                var loadAndZoomParams = {
                    left: extentTransformed[0],
                    bottom: extentTransformed[1],
                    right: extentTransformed[2],
                    top: extentTransformed[3],
                    changeset_comment: encodeURIComponent(changesetComment),
                    changeset_source: encodeURIComponent(changesetSource),
                    new_layer: false
                };

                if (taskCount == 1) {
                    //load OSM data and zoom to the bbox
                    editorService.sendJOSMCmd('http://127.0.0.1:8111/load_and_zoom', loadAndZoomParams);
                } else {
                    //probably too much OSM data to download, just zoom to the bbox
                    editorService.sendJOSMCmd('http://127.0.0.1:8111/zoom', loadAndZoomParams);
                }

            }
        };

        /**
         * Get the task bounding box, transforming to SWNE (min lat, min lon, max lat, max lon) array
         * as preferred by Overpass.
         */
        vm.overpassBBox = function() {
            var arrayBBox = geospatialService.transformExtentToLatLonArray(vm.taskBBox());

            // Transform WSEN to SWNE that Overpass prefers
            return [arrayBBox[1], arrayBBox[0], arrayBBox[3], arrayBBox[2]];
        }

        /**
         * Returns an array of unique usernames of users who appear in the selected task history.
         */
        vm.participantUsernames = function() {
            // Loop through the history and get a unique list of users to pass to Overpass Turbo
            var userList = [];
            var history = vm.selectedTaskData.taskHistory;
            if (history) {
                for (var i = 0; i < history.length; i++) {
                    var username = history[i].actionBy;
                    if (username && userList.indexOf(username) === -1) {
                        // user existing and not found in user list yet
                        userList.push(username);
                    }
                }
            }

            return userList;
        }

        /**
         * Returns a Moment instance representing the action date of the given
         * item. For non-locking actions, the timestamp is offset by the
         * configured `atticQueryOffsetMinutes` number of minutes. No offset
         * is applied for locking actions.
         *
         * @param atticDate
         */
        vm.offsetAtticDateMoment = function (item) {
          if (item.action === 'LOCKED_FOR_MAPPING' || item.action === 'LOCKED_FOR_VALIDATION') {
            return moment.utc(item.actionDate);
          }

          return moment.utc(item.actionDate).add(configService.atticQueryOffsetMinutes, 'minutes');
        }

        /**
         * Returns true if the given attic date, once offset by the configured
         * `atticQueryOffsetMinutes` number of minutes, represents a date in
         * the past that can be queried. Returns false if the date is still in
         * the future.
         * @param atticDate
         */
        vm.isAtticDateLive = function (item) {
          return vm.offsetAtticDateMoment(item).isSameOrBefore(moment());
        }

        /**
         * View the task AOI as of the given date via Overpass attic query.
         * @param atticDate
         */
        vm.viewAtticOverpass = function (item) {
          var adjustedDateString = vm.offsetAtticDateMoment(item).toISOString();
          var bbox = vm.overpassBBox().join(',');
          var query =
            '[out:xml][timeout:25][bbox:' + bbox + '][date:"' + adjustedDateString + '"];' +
            '( node(' + bbox + '); <; >; );' +
            'out meta;';


          // Try sending to JOSM if it's user's chosen editor, otherwise Overpass Turbo.
          var overpassApiURL = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
          if (vm.selectedEditor === 'josm') {
            editorService.sendJOSMCmd('http://127.0.0.1:8111/import', {
                                        new_layer: 'true',
                                        layer_name: adjustedDateString,
                                        layer_locked: 'true',
                                        url: encodeURIComponent(overpassApiURL)
                                      }
            ).catch(function() {
              //warn that JSOM couldn't be contacted
              vm.editorStartError = 'josm-error';
            });
          }
          else {
              var overpassTurboURL = 'https://overpass-turbo.eu/map.html?Q=' + encodeURIComponent(query);
              $window.open(overpassTurboURL);
          }
        };

        /**
         * Selects the given item for augmented diffing. If it's the first item,
         * it becomes selected; if it's the second item, a diff is kicked off. If the
         * same item is clicked twice, then an attic query is run for the item.
         */
        vm.selectItemForDiff = function(item) {
          if (vm.selectedItem === null) {
            vm.selectedItem = item;
          }
          else {
            if (vm.selectedItem !== item) {
              vm.viewAugmentedDiff(vm.selectedItem, item);
            }
            else {
              vm.viewAtticOverpass(item);
            }

            vm.selectedItem = null;
          }
        }

        /**
         * View augmented diff in achavi of the task AOI for the two given items
         * @param firstItem
         * @param secondItem
         */
        vm.viewAugmentedDiff = function (firstItem, secondItem) {
          // order firstItem and secondItem into earlierItem and laterItem
          var earlierItem = firstItem;
          var laterItem = secondItem;

          if (moment.utc(firstItem.actionDate).isAfter(moment.utc(secondItem.actionDate))) {
            earlierItem = secondItem;
            laterItem = firstItem;
          }

          var bbox = vm.overpassBBox().join(',');
          var query =
            '[out:xml][timeout:25][bbox:' + bbox + ']' +
            '[adiff:"' + moment.utc(earlierItem.actionDate).toISOString() + '","' +
                         vm.offsetAtticDateMoment(laterItem).toISOString() + '"];' +
            '( node(' + bbox + '); <; >; );' +
            'out meta geom qt;';

          // Send users to achavi for visualization of augmented diff
          var overpassURL = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
          var achaviURL = 'https://overpass-api.de/achavi/?url=' + encodeURIComponent(overpassURL);
          $window.open(achaviURL);
        };

        /**
         * Set the accept license modal to visible/invisible
         * @param showModal
         */
        vm.setShowLicenseModal = function (showModal) {
            vm.showLicenseModal = showModal;
        };

        /**
         * Accept the license for this user
         */
        vm.acceptLicense = function () {
            var resultsPromise = userService.acceptLicense(vm.projectData.licenseId);
            resultsPromise.then(function () {
                // On success
                vm.showLicenseModal = false;
                if (vm.lockingReason === 'MAPPING') {
                    vm.lockSelectedTaskMapping();
                }
                else if (vm.lockingReason === 'VALIDATION') {
                    vm.lockSelectedTaskValidation();
                }
            }, function () {
                // On error
            });
        };

        /**
         * Refresh the map and selected task on error
         * @param projectId
         * @param error
         */
        function onLockError(projectId, error) {
            // Could not lock task
            // Refresh the map and selected task.
            refreshProject(projectId);
            vm.taskLockError = true;
            // Check if it is an unauthorized error. If so, display appropriate message
            if (error.status == 401) {
                vm.isAuthorized = false;
            }
            // User has not accepted the license terms
            else if (error.status == 409) {
                vm.isAuthorized = true;
                vm.hasAcceptedLicenseTerms = false;
                // call the API to get the license terms
                var resultsPromise = licenseService.getLicense(vm.projectData.licenseId);
                resultsPromise.then(function (data) {
                    // On success
                    vm.license = data;
                    vm.showLicenseModal = true;
                }, function () {
                    // On error
                });
            }
            else {
                // Another error occurred.
                vm.isAuthorized = true;
                vm.taskLockErrorMessage = error.data.Error;
            }
        }

        function onUnLockError(projectId, error) {
            // Could not lock task
            // Refresh the map and selected task.
            //TODO - The following reset lines are repeated in several places in this file.
            //Refactoring to a single function call was considered, however it was decided that the ability to
            //call the resets individually was desirable and would help readability.
            //The downside is that any change will have to be replicated in several places.
            //A fundamental refactor of this controller should be considered at some stage.
            vm.resetErrors();
            vm.resetStatusFlags();
            vm.resetTaskData();
            vm.clearCurrentSelection();
            refreshProject(projectId);
            vm.taskUnLockError = true;
            // Check if it is an unauthorized error. If so, display appropriate message
            if (error.status == 401) {
                vm.isAuthorized = false;
            }
            else {
                // Another error occurred.
                vm.isAuthorized = true;
                vm.taskUnLockErrorMessage = error.data.Error;
            }
        }

        /**
         * Convenience method to get comma separated list of currently selected tasks ids
         * @returns {*}
         */
        vm.getSelectTaskIds = function () {
            if (vm.multiLockedTasks && vm.multiLockedTasks.length > 0) {
                var data = vm.multiLockedTasks;
                var tasks = data.map(function (task) {
                    return task.taskId;
                });
                return tasks.join(',');
            }
            else if (vm.lockedTaskData) {
                return vm.lockedTaskData.taskId;
            }
            return null;
        };

        /**
         * Highlights the set of tasks on the map
         * @param doneTaskIds - array of task ids
         */
        vm.highlightTasks = function (doneTaskIds) {
            //highlight features
            var features = taskService.getTaskFeaturesByIds(vm.taskVectorLayer.getSource().getFeatures(), doneTaskIds);
            vm.highlightVectorLayer.getSource().addFeatures(features);
        };

        /**
         * Locks the set of tasks for validation
         * @param doneTaskIds - array of task ids
         */
        vm.lockTasksForValidation = function (doneTaskIds) {
            vm.selectInteraction.getFeatures().clear();

            //use doneTaskIds to get corresponding subset of tasks for selection from the project
            var tasksForSelection = vm.projectData.tasks.features.filter(function (task) {
                var i = doneTaskIds.indexOf(task.properties.taskId);
                if (i !== -1)
                    return doneTaskIds[i];
            });

            //select each one by one
            tasksForSelection.forEach(function (feature) {
                var feature = taskService.getTaskFeatureById(vm.taskVectorLayer.getSource().getFeatures(), feature.properties.taskId);
                vm.selectInteraction.getFeatures().push(feature);
            });

            //put the UI in to locked for multi validation mode
            var lockPromise = taskService.lockTasksValidation(vm.projectData.projectId, doneTaskIds);
            lockPromise.then(function (tasks) {
                // refresh the project, to ensure we catch up with any status changes that have happened meantime
                // on the server
                // TODO - The following reset lines are repeated in several places in this file.
                // Refactoring to a single function call was considered, however it was decided that the ability to
                // call the resets individually was desirable and would help readability.
                // The downside is that any change will have to be replicated in several places.
                // A fundamental refactor of this controller should be considered at some stage.
                vm.resetErrors();
                vm.resetStatusFlags();
                vm.resetTaskData();
                refreshProject(vm.projectData.projectId);
                vm.currentTab = 'validation';
                vm.validatingStep = 'multi-locked';
                vm.multiSelectedTasksData = tasks;
                vm.multiLockedTasks = tasks;
                vm.isSelectedValidatable = true;
                vm.multiLockedTasks.forEach(function(task) {
                    vm.lockTime[task.taskId] = getLastLockedAction(task).actionDate;
                });
            }, function (error) {
                onLockError(vm.projectData.projectId, error);
            });
        };

        vm.resetToSelectingStep = function () {
            //TODO - The following reset lines are repeated in several places in this file.
            //Refactoring to a single function call was considered, however it was decided that the ability to
            //call the resets individually was desirable and would help readability.
            //The downside is that any change will have to be replicated in several places.
            //A fundamental refactor of this controller should be considered at some stage.
            vm.resetErrors();
            vm.resetStatusFlags();
            vm.resetTaskData();
            vm.clearCurrentSelection();
            vm.mappingStep = 'selecting';
            vm.validatingStep = 'selecting';

        };

        /**
         * Create the url for downloading the currently selected tasks as a gpx file
         * @returns {string}
         */
        vm.getGpxDownloadURL = function () {
            if (vm.projectData && vm.getSelectTaskIds()) {
                return configService.tmAPI + '/project/' + vm.projectData.projectId + '/tasks_as_gpx?tasks=' + vm.getSelectTaskIds() + '&as_file=true';
            }
            else return '';
        };

        /**
         * Sorts the table by property name
         * @param propertyName
         */
        vm.sortBy = function (propertyName) {
            vm.reverse = (vm.propertyName === propertyName) ? !vm.reverse : false;
            vm.propertyName = propertyName;
        };

        /**
         * Search for a user
         * @param search
         */
        vm.searchUser = function (search) {
            // If the search is empty, do nothing.
            if (!search || search.length === 0) {
              vm.suggestedUsers = [];
              return $q.resolve(vm.suggestedUsers);
            }

            // Search for a user by calling the API
            var resultsPromise = userService.searchUser(search, vm.projectData ? parseInt(vm.projectData.projectId, 10) : null);
            return resultsPromise.then(function (data) {
                // On success
                vm.suggestedUsers = data.users;
                return vm.suggestedUsers;
            }, function () {
                // On error
            });
        };

        /**
         * Formats the user tag
         * @param item
         */
        vm.formatUserTag = function (item) {
            // Format the user tag by wrapping into brackets so it is easier to detect that it is a username
            // especially when there are spaces in the username
            return '@[' + item.username + ']';
        };
    }
})
();
