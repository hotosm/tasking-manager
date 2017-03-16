(function () {

    'use strict';

    /**
     * Project controller which manages activating a project the UI for user task selection and contribution workflow
     */
    angular
        .module('taskingManager')
        .controller('projectController', ['$scope', '$location', 'mapService', 'projectService', 'styleService', 'taskService', projectController]);

    function projectController($scope, $location, mapService, projectService, styleService, taskService) {
        var vm = this;
        vm.projectData = null;
        vm.taskVectorLayer = null;
        vm.map = null;

        // tab and view control
        vm.currentTab = '';
        vm.mappingStep = '';
        vm.taskError = '';

        //selected task
        vm.selectedTaskData = null;
        vm.isSelectTaskMappable = false;

        //locked task
        vm.lockedTaskData = null;

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
        function getVPadding() {
            // padding to makes sure there is plenty of clear space around feature on map to keep visual
            // context of feature location
            return vm.map.getSize()[1] * 0.3;
        }


        function selectFeature(feature) {
            select.getFeatures().clear();
            select.getFeatures().push(feature);
            onTaskSelection(feature);
            var vPadding = getVPadding();
            vm.map.getView().fit(feature.getGeometry().getExtent(), {padding: [vPadding, vPadding, vPadding, vPadding]});
        }

        /**
         * Sets up a randomly selected task as the currently selected task
         */
        vm.selectRandomTask = function () {
            var feature = taskService.getRandomMappableTaskFeature(vm.taskVectorLayer.getSource().getFeatures());
            if (feature) {
                selectFeature(feature);
            }
            else {
                vm.selectedTaskData = null;
                //vm.selectedTaskFeature = null;
                vm.isSelectTaskMappable = false;
                vm.taskError = 'none-available';
                vm.mappingStep = 'viewing';
            }
        };

        /**
         * clears the currently selected task.  Clears down/resets the vm properties and clears the feature param in the select interaction object.
         */
        vm.clearCurrentSelection = function () {
            vm.selectedTaskData = null;
            //vm.selectedTaskFeature = null;
            vm.isSelectTaskMappable = false;
            vm.currentTab = 'mapping';
            vm.mappingStep = 'selecting';
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
                addAoiToMap(vm.projectData.areaOfInterest);
                addProjectTasksToMap(vm.projectData.tasks, true);
            }, function () {
                // project not returned successfully
                // TODO - may want to handle error
            });
        };

        function refreshProject(id) {
            var resultsPromise = projectService.getProject(id);
            resultsPromise.then(function (data) {
                //project returned successfully
                vm.projectData = data;
                // TODO: get the map extent before add so can return to same extent after add
                addProjectTasksToMap(vm.projectData.tasks, false);
            }, function () {
                // project not returned successfully
                // TODO - may want to handle error
            });

        }

        /**
         * Adds project tasks to map as features from geojson
         * @param tasks
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

            // read tasks JSON into features
            var format = new ol.format.GeoJSON();
            var taskFeatures = format.readFeatures(tasks, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });
            source.addFeatures(taskFeatures);
            if(fitToProject) {
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
            var format = new ol.format.GeoJSON();
            var aoiFeatures = format.readFeature(aoi, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });
            source.addFeature(aoiFeatures);
        }

        /**
         * Gets a task from the server and sets up the task returned as the currently selected task
         * @param feature
         */
        function onTaskSelection(feature) {
            //get id from feature
            var taskId = feature.get('taskId');
            var projectId = vm.projectData.projectId;
            // get full task from task service call
            var taskPromise = taskService.getTask(projectId, taskId);
            taskPromise.then(function (data) {
                //task returned successfully
                //vm.selectedTaskFeature = feature;
                vm.selectedTaskData = data;
                vm.isSelectTaskMappable = !data.taskLocked && (data.taskStatus === 'READY' || data.taskStatus === 'INVALIDATED');
                vm.taskError = vm.isSelectTaskMappable ? '' : 'task-not-mappable';
                vm.currentTab = 'mapping';
                vm.mappingStep = 'viewing';
            }, function () {
                // task not returned successfully
                vm.selectedTaskData = null;
                //vm.selectedTaskFeature = null;
                vm.isSelectTaskMappable = false;
                vm.currentTab = 'mapping';
                vm.taskError = 'task-get-error';
                vm.mappingStep = 'viewing';
            });
        }

        function setLockedTask(task) {
            var taskId = task.taskId;
            var projectId = vm.projectData.projectId;
            // get full task from task service call
            var taskPromise = taskService.getTask(projectId, taskId);
            taskPromise.then(function (data) {
                //task returned successfully, need to recheck it's status to see if it's ok to map
                if (data.taskStatus === 'READY' || data.taskStatus === 'INVALIDATED') {
                    //ok to map
                }
                else {
                    //it's become unmappable while user was thinking
                }
            }, function () {
                // TODO - may need to handle error
            });
        }

        vm.unLockTask = function (comment, status) {
            var projectId = vm.projectData.projectId;
            var taskId = vm.lockedTaskData.taskId;
            var unLockPromise = taskService.unLockTask(projectId, taskId, comment, status);
            unLockPromise.then(function (response) {
                refreshProject(projectId);
                onTaskSelection(taskService.getTaskFeatureById(vm.taskVectorLayer.getSource().getFeatures(), taskId));
            }, function () {
            });
        }

        vm.lockSelectedTask = function () {

            var projectId = vm.projectData.projectId;
            var taskId = vm.selectedTaskData.taskId;

            // - try to lock the task, call returns a promise
            var lockPromise = taskService.lockTask(projectId, taskId);
            lockPromise.then(function (response) {
                // - if task successfully locked update view to show task locked for mapping UI
                //TODO - need the task return with the lock response
                // refresh the project, to ensure we catch up with any status changes
                // on the server
                refreshProject(projectId);

                //refresh the task to check it's still mappable
                var taskPromise = taskService.getTask(projectId, taskId);
                taskPromise.then(function (data) {
                    //task returned successfully, need to recheck it's status to see if it's ok to map
                    if (data.taskStatus === 'READY' || data.taskStatus === 'INVALIDATED') {
                        //ok to map
                        //set view to locked
                        vm.currentTab = 'mapping';
                        vm.mappingStep = 'locked';
                        vm.selectedTaskData = data;
                        vm.isSelectTaskMappable = true;
                        vm.taskError = '';
                        vm.lockedTaskData = data;
                    }
                    else {
                        //it's become unmappable while user was thinking
                        // unlock it and return view to viewing
                        //TODO: unlock it again
                        var unLockPromise = taskService.unLockTask(projectId, taskId, '', data.taskStatus);
                        unLockPromise.then(function (response) {
                            refreshProject(projectId);
                            onTaskSelection(taskService.getTaskFeatureById(vm.taskVectorLayer.getSource().getFeatures(), taskId));
                        }, function () {
                        });
                    }
                }, function () {
                    // TODO - may need to handle error
                });

            }, function () {
                // - otherwise, most likely because task was locked while viewing,
                // call onTaskSelection to update UI to show task status
                refreshProject(projectId);
                onTaskSelection(taskService.getTaskFeatureById(vm.taskVectorLayer.getSource().getFeatures(), taskId));
            });
        }
    }
})();
