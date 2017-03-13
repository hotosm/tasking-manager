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

        activate();

        function activate() {
            //TODO: Set up sidebar tabs
            vm.currentTab = 'description';
            vm.mappingStep = 'select';
            mapService.createOSMMap('map');
            vm.map = mapService.getOSMMap();
            var select = new ol.interaction.Select({
                style: styleService.getSelectedStyleFunction
            });
            vm.map.addInteraction(select);
            select.on('select', function (event) {

                $scope.$apply(function () {
                    var feature = event.selected[0];
                    var status = feature.get('taskStatus');
                    var isLocked = feature.get('taskLocked');
                    vm.selectedTask = feature;
                    vm.isSelectTaskMappable = !isLocked && status === 'READY' || status === 'INVALIDATED';
                    vm.currentTab = 'mapping';
                    vm.mappingStep = 'view';
                });
            });

            var id = $location.search().project;
            initialiseProject(id);
            //TODO: put the project metadata (description instructions on disebar tabs
        }

        vm.selectRandomTask = function () {

            var task = getRandomMappableTask(vm.project.tasks);
            if (task) {
                console.log(task.properties.taskId);
                vm.selectedTask = task;
                vm.isSelectTaskMappable = true;
                vm.mappingStep = 'view';

                var layers = vm.map.getLayers();
                var keys = layers.getKeys();
                var props = layers.getProperties();


                var format = new ol.format.GeoJSON();
                var taskFeature = format.readFeature(task, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
                var vPadding = vm.map.getSize()[1] * 0.3;
                vm.map.getView().fit(taskFeature.getGeometry().getExtent(), {padding: [vPadding, vPadding, vPadding, vPadding]});
            }
            else {
                vm.selectedTask = null;
                vm.isSelectTaskMappable = false;
                vm.mappingStep = 'none-available';
            }

        };

        /**
         * Get a  project with using it's id
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

        function onTaskSelection(feature) {

            vm.selectedTask = feature;
            vm.isSelectTaskMappable = true;
            vm.currentTab = 'mapping';
            vm.mappingStep = 'view';

            var vPadding = vm.map.getSize()[1] * 0.3;
            //vm.map.getView().fit(feature.getGeometry().getExtent(),{padding: [vPadding,vPadding,vPadding,vPadding]});
        }

        vm.clearCurrentSelection = function () {

            vm.selectedTask = null;
            vm.isSelectTaskMappable = false;
            vm.currentTab = 'mapping';
            vm.mappingStep = 'select';

        };
    }
})();
