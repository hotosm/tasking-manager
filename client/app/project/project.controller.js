(function () {

    'use strict';

    /**
     * Project controller which manages activating a project the UI for user task selection and contribution workflow
     */
    angular
        .module('taskingManager')
        .controller('projectController', ['$scope', '$location', 'mapService', 'projectService', 'styleService', 'taskService', 'geospatialService', projectController]);

    function projectController($scope, $location, mapService, projectService, styleService, taskService, geospatialService) {
        var vm = this;
        vm.projectData = null;
        vm.taskVectorLayer = null;
        vm.map = null;

        // tab and view control
        vm.currentTab = '';
        vm.mappingStep = '';
        vm.validatingStep = '';
        vm.taskError = '';
        vm.taskErrorValidation = '';
        vm.taskLockError = false;

        //selected task
        vm.selectedTaskData = null;
        vm.isSelectTaskMappable = false;
        vm.isSelectTaskValidatable = false;

        //locked task
        vm.lockedTaskData = null;

        //project display text
        vm.description = '';
        vm.shortDescription = '';
        vm.instructions = '';

        //interaction
        var select = new ol.interaction.Select({
            style: styleService.getSelectedStyleFunction
        });

        //bound from the html
        vm.comment = '';

        activate();

        function activate() {
            vm.currentTab = 'description';
            vm.mappingStep = 'selecting';
            vm.validatingStep = 'selecting';
            mapService.createOSMMap('map');
            vm.map = mapService.getOSMMap();

            vm.map.addInteraction(select);
            select.on('select', function (event) {
                $scope.$apply(function () {
                    var feature = event.selected[0];
                    onTaskSelection(feature);
                });
            });

            var id = $location.search().project;
            initialiseProject(id);
            //TODO: put the project metadata (description and instructions on siedbar tabs)
        }

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
            var padding = getPaddingSize();
            vm.map.getView().fit(feature.getGeometry().getExtent(), {padding: [padding, padding, padding, padding]});
        }

        /**
         * Sets up a randomly selected task as the currently selected task
         */
        vm.selectRandomTask = function () {
            var feature = null;
            if (vm.currentTab === 'mapping') {
                feature = taskService.getRandomMappableTaskFeature(vm.taskVectorLayer.getSource().getFeatures());
            }
            else if (vm.currentTab === 'validating') {
                feature = taskService.getRandomTaskFeatureForValidation(vm.taskVectorLayer.getSource().getFeatures());
            }

            if (feature) {
                selectFeature(feature);
            }
            else {
                vm.selectedTaskData = null;
                vm.isSelectTaskMappable = false;
                vm.taskError = 'none-available';
                vm.taskErrorValidation = 'none-available';
                vm.taskLockError = false;
                vm.mappingStep = 'viewing';
                vm.validatingStep = 'viewing';
            }
        };


        /**
         * clears the currently selected task.  Clears down/resets the vm properties and clears the feature param in the select interaction object.
         */
        vm.clearCurrentSelection = function () {
            vm.selectedTaskData = null;
            vm.isSelectTaskMappable = false;
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

            }, function () {
                // task not returned successfully
                vm.selectedTaskData = null;
                vm.isSelectTaskMappable = false;
                vm.isSelectTaskValidatable = false;
                vm.taskError = 'task-get-error';
                vm.taskErrorValidation = 'task-get-error';
                vm.mappingStep = 'viewing';
                vm.validatingStep = 'viewing';
            });

            // TODO: This is a bit icky.  Need to find something better.  Maybe when roles are in place.
            // Need to make a decision on what tab to go to if user has clicked map but is not on mapping or validating
            // tab
            if(vm.currentTab === 'description' || vm.currentTab !== 'validating'){
                //prioritise validation
                vm.currentTab = vm.isSelectTaskValidatable ? 'validating' : 'mapping'
            }
        }

        /**
         * Sets up the view model for the task options and actions for passed in task data object.
         * @param data - task JSON data object
         */
        function refreshCurrentSelection(data) {
            vm.mappingStep = 'viewing';
            vm.validatingStep = 'viewing';
            vm.selectedTaskData = data;
            vm.isSelectTaskMappable = !data.taskLocked && (data.taskStatus === 'READY' || data.taskStatus === 'INVALIDATED');
            vm.taskError = vm.isSelectTaskMappable ? '' : 'task-not-mappable';
            vm.isSelectTaskValidatable = !data.taskLocked && (data.taskStatus !== 'READY');
            vm.taskErrorValidation = vm.isSelectTaskValidatable ? '' : 'task-not-validatable';
        }

        /**
         * Call api to unlock currently locked task.  Will pass the comment and new status to api.  Will update view and map after unlock.
         * @param comment
         * @param status
         */
        vm.unLockTask = function (comment, status) {
            var projectId = vm.projectData.projectId;
            var taskId = vm.lockedTaskData.taskId;
            var unLockPromise = taskService.unLockTask(projectId, taskId, comment, status);
            vm.comment = '';
            unLockPromise.then(function (data) {
                refreshProject(projectId);
                if (status == 'DONE') {
                    vm.lockedTaskData = null;
                    vm.taskLockError = false;
                    vm.clearCurrentSelection();
                }
                else {
                    vm.lockedTaskData = null;
                    vm.taskLockError = false;
                    refreshCurrentSelection(data);
                }
            }, function () {
                // could not unlock lock task, very unlikey to happen but
                // most likely because task was unlocked or status changed on server
                // refresh map and selected task.  UI will react to new state if task
                refreshProject(projectId);
                onTaskSelection(taskService.getTaskFeatureById(vm.taskVectorLayer.getSource().getFeatures(), taskId));
            });
        }

        /**
         * Call api to lock currently selected task.  Will update view and map after unlock.
         */
        vm.lockSelectedTask = function () {
            var projectId = vm.projectData.projectId;
            var taskId = vm.selectedTaskData.taskId;
            // - try to lock the task, call returns a promise
            var lockPromise = taskService.lockTask(projectId, taskId);
            lockPromise.then(function (data) {
                // refresh the project, to ensure we catch up with any status changes that have happened meantime
                // on the server
                refreshProject(projectId);
                vm.currentTab = 'mapping';
                vm.mappingStep = 'locked';
                vm.selectedTaskData = data;
                vm.isSelectTaskMappable = true;
                vm.taskError = '';
                vm.taskLockError = false;
                vm.lockedTaskData = data;
            }, function () {
                // could not lock task for mapping, most likely because task was locked or status changed user after
                // selection but before lock,
                // refresh map and selected task.  UI will react to new state if task
                refreshProject(projectId);
                onTaskSelection(taskService.getTaskFeatureById(vm.taskVectorLayer.getSource().getFeatures(), taskId));
                vm.taskLockError = true;
            });
        }
    }
})();
