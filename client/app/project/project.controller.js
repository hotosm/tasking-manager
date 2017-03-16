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

        //selected task
        vm.selectedTask = null;
        vm.isSelectTaskMappable = false;

        //interaction
        var select = new ol.interaction.Select({
            style: styleService.getSelectedStyleFunction
        });

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
         * Sets up a randomly selected task as the currently selected task
         */
        vm.selectRandomTask = function () {
            var feature = taskService.getRandomMappableTaskFeature(vm.taskVectorLayer.getSource().getFeatures());
            if (feature) {
                select.getFeatures().clear();
                select.getFeatures().push(feature);
                onTaskSelection(feature);
                // padding to makes sure there is plenty of clear space around feature on map to keep visual
                // context of feature location
                var vPadding = vm.map.getSize()[1] * 0.3;
                vm.map.getView().fit(feature.getGeometry().getExtent(), {padding: [vPadding, vPadding, vPadding, vPadding]});
            }
            else {
                vm.selectedTask = null;
                vm.isSelectTaskMappable = false;
                vm.mappingStep = 'none-available';
            }
        };

        /**
         * clears the currently selected task.  Clears down/resets the vm properties and clears the feature param in the select interaction object.
         */
        vm.clearCurrentSelection = function () {
            vm.selectedTask = null;
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
                addProjectTasksToMap(vm.projectData.tasks);
            }, function () {
                // project not returned successfully
                // TODO - may want to handle error
            });
        };

        /**
         * Adds project tasks to map as features from geojson
         * @param tasks
         */
        function addProjectTasksToMap(tasks) {
            //TODO: may want to refactor this into a service at some point so that it can be reused
            var source = new ol.source.Vector();
            vm.taskVectorLayer = new ol.layer.Vector({
                source: source,
                name: 'tasks',
                style: styleService.getTaskStyleFunction
            });
            vm.map.addLayer(vm.taskVectorLayer);

            // read tasks JSON into features
            var format = new ol.format.GeoJSON();
            var taskFeatures = format.readFeatures(tasks, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });
            source.addFeatures(taskFeatures);
            vm.map.getView().fit(source.getExtent());
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
                vm.selectedTask = data;
                vm.isSelectTaskMappable = !data.taskLocked && (data.taskStatus === 'READY' || data.taskStatus === 'INVALIDATED');
                vm.currentTab = 'mapping';
                vm.mappingStep = 'viewing';
            }, function () {
                // task not returned successfully
                vm.selectedTask = null;
                vm.isSelectTaskMappable = false;
                vm.currentTab = 'mapping';
                vm.mappingStep = 'task-get-error';
            });
        }
    }
})();
