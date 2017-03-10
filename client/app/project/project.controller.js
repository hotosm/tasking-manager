(function () {

    'use strict';

    /**
     * Project controller which manages activating a project the UI for user task selection and contribution workflow
     */
    angular
        .module('taskingManager')
        .controller('projectController', ['$location', 'mapService', 'projectService', 'styleService', projectController]);

    function projectController($location, mapService, projectService, styleService) {
        var vm = this;
        vm.project = null;
        vm.map = null;
        vm.mappingStep = '';

        activate();

        function activate() {
            //TODO: Set up sidebar tabs
            vm.currentTab = 'description';
            mapService.createOSMMap('map');
            vm.map = mapService.getOSMMap();
            var id = $location.search().project;
            initialiseProject(id);
            //TODO: put the project metadata (description instructions on disebar tabs
        }

        /**
         * Get a  project with using it's id
         */
        function initialiseProject(id){
            var resultsPromise = projectService.getProject(id);
            resultsPromise.then(function (data) {
                //project returned successfully
                vm.project = data;
                addAoiToMap(vm.project.areaOfInterest);
                addProjectTasksToMap(vm.project.tasks);
            }, function(){
                // project not returned successfully
                // TODO - may want to handle error
            });
        };

        /**
         * Adds project tasks to map as features from geojson
         * @param tasks
         */
        function addProjectTasksToMap(tasks){
            //TODO: may want to refactor this into a service at some point so that it can be reused
            var source = new ol.source.Vector();
            var vector = new ol.layer.Vector({
                source: source,
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
        function addAoiToMap(aoi){
            //TODO: may want to refactor this into a service at some point so that it can be resused
            var source = new ol.source.Vector();
            var vector = new ol.layer.Vector({
                source: source
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
    }
})();
