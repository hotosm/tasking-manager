(function () {

    'use strict';

    /**
     * Project controller which manages activating a project the UI for user task selection and contribution workflow
     */
    angular
        .module('taskingManager')
        .controller('projectController', ['$scope', '$location', 'mapService', 'projectService', 'styleService', projectController]);

    function projectController($scope, $location, mapService, projectService, styleService) {
        var vm = this;
        vm.project = null;
        vm.map = null;
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
            //TODO: Set up sidebar tabs
            vm.currentTab = 'description';
            vm.mappingStep = 'select';
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
            //TODO: put the project metadata (description instructions on siedbar tabs
        }

        vm.selectRandomTask = function () {
            var task = getRandomMappableTask(vm.project.tasks);
            if (task) {
                //iterate layers to find task layer
                var layers = vm.map.getLayers();
                for (var i = 0; i < layers.getLength(); i++) {
                    if (layers.item(i).get('name') === 'tasks') {
                        var feature = layers.item(i).getSource().getFeatures().filter(function (feature) {
                            if (feature.get('taskId') === task.properties.taskId) {
                                // TODO the next few steps might be better done with event handling and dispatching to resuse
                                // through the listener code on the select interaction.  Need to find a way to do that
                                select.getFeatures().clear();
                                select.getFeatures().push(feature);
                                onTaskSelection(feature);
                                var vPadding = vm.map.getSize()[1] * 0.3;
                                vm.map.getView().fit(feature.getGeometry().getExtent(), {padding: [vPadding, vPadding, vPadding, vPadding]});
                            }
                        });
                        break;
                    }
                }
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
            vm.mappingStep = 'select';
            select.getFeatures().clear();
        };

        /**
         * Initilaise a project with using it's id
         * @param id - id of the project to initialise
         */
        function initialiseProject(id) {
            var resultsPromise = projectService.getProject(id);
            resultsPromise.then(function (data) {
                //project returned successfully
                vm.project = data;
                addAoiToMap(vm.project.areaOfInterest);
                addProjectTasksToMap(vm.project.tasks);
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
            var vector = new ol.layer.Vector({
                source: source,
                name: 'tasks',
                style: styleService.getTaskStyleFunction
            });
            vm.map.addLayer(vector);

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
         * returns a randomly selected mappable task from the passed in tasks JSON object
         * @param tasks - the set of tasks from which to find a random task
         * @returns task if one found, null if non available
         */
        function getRandomMappableTask(tasks) {

            // get all non locked ready tasks,
            var candidates = []
            var candidates = tasks.features.filter(function (item) {
                if (!item.properties.taskLocked && item.properties.taskStatus === 'READY') return item;
            });
            // if no ready tasks, get non locked invalid tasks
            if (candidates.length == 0) {
                candidates = tasks.features.filter(function (item) {
                    if (!item.properties.taskLocked && item.properties.taskStatus === 'INVALIDATED') return item;
                });
            }

            // if tasks were found, return a random task
            if (candidates.length > 0) {
                return candidates[Math.floor((Math.random() * (candidates.length - 1)))];
            }

            // if all else fails, return null
            return null;
        }

        /**
         * Sets up the model for currently selected feature
         * @param feature
         */
        function onTaskSelection(feature) {
            var taskStatus = feature.get('taskStatus');
            var taskLocked = feature.get('taskLocked')
            vm.selectedTask = feature;
            vm.isSelectTaskMappable = !taskLocked && (taskStatus === 'READY' || taskStatus === 'INVALIDATED');
            vm.currentTab = 'mapping';
            vm.mappingStep = 'view';
        }


    }
})();
