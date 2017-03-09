(function () {

    'use strict';

    /**
     * Create project controller which manages creating a new project
     */
    angular
        .module('taskingManager')
        .controller('createProjectController', ['$scope', '$location', 'mapService', 'aoiService', 'projectService', createProjectController]);

    function createProjectController($scope, $location, mapService, aoiService, projectService) {
        var vm = this;

        // Wizard 
        vm.currentStep = '';
        vm.isTaskGrid = false;
        vm.isTaskArbitrary = false;
        vm.projectName = '';
        vm.projectNameForm = {};

        // AOI 
        vm.AOI = null;
        vm.isDrawnAOI = false;
        vm.isImportedAOI = false;

        // Grid
        vm.isTaskGrid = false;
        vm.isTaskArbitrary = false;
        vm.sizeOfTasks = 0; 
        vm.MAX_SIZE_OF_TASKS = 1000; //in square kilometers
        vm.numberOfTasks = 0;
        vm.MAX_NUMBER_OF_TASKS = 1500;

        // Variables for the zoom level used for creating the grid
        vm.DEFAULT_ZOOM_LEVEL_OFFSET = 2;
        vm.initialZoomLevelForTaskGridCreation = 0;
        vm.userZoomLevelOffset = 0;

        // Validation
        vm.isAOIValid = false;
        vm.AOIValidationMessage = '';
        vm.isSplitPolygonValid = true;
        vm.splitPolygonValidationMessage = '';
        vm.isimportError = false;
        vm.createProjectFail = false;
        vm.createProjectSuccess = false;

        activate();

        function activate() {
            vm.currentStep = 'area';

            mapService.createOSMMap('map');
            aoiService.initDrawTools();
            projectService.init();
            addGeocoder_();
        }

        /**
         * Set the current wizard step in the process of creating a project
         * @param wizardStep the step in the wizard the user wants to go to
         */
        vm.setWizardStep = function(wizardStep){
            if (wizardStep === 'area'){
                vm.isTaskGrid = false;
                vm.isTaskArbitrary = false;
                aoiService.removeAllFeatures();
                projectService.removeTaskGrid();
                vm.currentStep = wizardStep;
            }
            else if (wizardStep === 'tasks'){
                if (vm.isDrawnAOI) {
                    var aoiValidationResult = projectService.validateAOI(aoiService.getFeatures());
                    vm.isAOIValid = aoiValidationResult.valid;
                    vm.AOIValidationMessage = aoiValidationResult.message;

                    if (vm.isAOIValid) {
                        aoiService.setDrawPolygonActive(false);
                        aoiService.zoomToExtent();
                        // Use the current zoom level + a standard offset to determine the default task grid size for the AOI
                        vm.zoomLevelForTaskGridCreation = mapService.getOSMMap().getView().getZoom()
                            + vm.DEFAULT_ZOOM_LEVEL_OFFSET;
                        // Reset the user zoom level offset
                        vm.userZoomLevelOffset = 0;
                        vm.currentStep = wizardStep;
                    }
                }
                if (vm.isImportedAOI){
                    // TODO: validate AOI - depends on what API supports! Self-intersecting polygons?
                    aoiService.setDrawPolygonActive(false);
                    aoiService.zoomToExtent();
                    // Use the current zoom level + a standard offset to determine the default task grid size for the AOI
                    vm.zoomLevelForTaskGridCreation = mapService.getOSMMap().getView().getZoom()
                        + vm.DEFAULT_ZOOM_LEVEL_OFFSET;
                    vm.currentStep = wizardStep;
                    // Reset the user zoom level offset
                    vm.userZoomLevelOffset = 0;
                }
            }
            else if (wizardStep === 'taskSize'){
                var grid = projectService.getTaskGrid();
                if (grid){
                    vm.currentStep = wizardStep;
                }
            }
            else if (wizardStep === 'review'){
                vm.createProjectFailed = false;
                vm.currentStep = wizardStep;
            }
            else {
                vm.currentStep = wizardStep;
            }
        };

        /**
         * Decides if a step should be shown as completed in the progress bar
         * @param step
         * @returns {boolean}
         */
        vm.showWizardStep = function(wizardStep){
            var showStep = false;
            if (wizardStep === 'area'){
                if (vm.currentStep === 'area' || vm.currentStep === 'tasks' || vm.currentStep === 'taskSize' || vm.currentStep === 'review'){
                    showStep = true;
                }
            }
            else if (wizardStep === 'tasks'){
                if ( vm.currentStep === 'tasks' || vm.currentStep === 'taskSize' || vm.currentStep === 'review'){
                    showStep = true;
                }
            }
            else if (wizardStep === 'taskSize'){
                if (vm.currentStep === 'taskSize' || vm.currentStep === 'review'){
                    showStep = true;
                }
            }
            else if (wizardStep === 'review'){
                if (vm.currentStep === 'review'){
                    showStep = true;
                }
            }
            else {
                showStep = false;
            }
            return showStep;
        };

        /**
         * Draw Area of Interest
         */
        vm.drawAOI = function(){
            if (!aoiService.getDrawPolygonActive()){
                aoiService.setDrawPolygonActive(true);
                vm.isDrawnAOI = true;
                vm.isImportedAOI = false;
            }
        };

        /**
         * Create a task grid
         */
        vm.createTaskGrid = function(){
            
            vm.isTaskGrid = true;
            
            // Remove existing task grid
            projectService.removeTaskGrid();

             // Get and set the AOI
            var areaOfInterest = aoiService.getFeatures();
            projectService.setAOI(areaOfInterest);

            // Create a task grid
            // TODO: may need to fix areaOfInterest[0] as it may need to work for multipolygons
            if (vm.isDrawnAOI){
                var taskGrid = projectService.createTaskGrid(areaOfInterest[0], vm.zoomLevelForTaskGridCreation + vm.userZoomLevelOffset);
                projectService.setTaskGrid(taskGrid);
                projectService.addTaskGridToMap();

                // Get the number of tasks in project
                vm.numberOfTasks = projectService.getNumberOfTasks();

                // Get the size of the tasks
                vm.sizeOfTasks = projectService.getTaskSize();
            }
            if (vm.isImportedAOI){
                // TODO: create task grid from imported AOI
            }
        };

        /**
         * Change the size of the tasks in the grid by increasing or decreasing the zoom level
         * @param zoomLevelOffset
         */
        vm.changeSizeTaskGrid = function(zoomLevelOffset){
            vm.userZoomLevelOffset += zoomLevelOffset;
            vm.createTaskGrid();
        };

        /**
         * Import a GeoJSON, KML or Shapefile and add it to the map
         * TODO: add more error handling
         * @param file
         */
        vm.import = function (file) {
            // Set drawing an AOI to inactive
            if (aoiService.getDrawPolygonActive()){
                aoiService.setDrawPolygonActive(false);
            }
            vm.isImportError = false;
            if (file) {
                aoiService.removeAllFeatures();
                var fileReader = new FileReader();
                fileReader.onloadend = function (e) {
                    var data = e.target.result;
                    var uploadedFeatures = null;
                    if (file.name.substr(-4) === 'json') {
                        uploadedFeatures = getFeaturesFromGeoJSON_(data);
                        setImportedAOI_(uploadedFeatures);
                    }
                    else if (file.name.substr(-3) === 'kml') {
                        uploadedFeatures = getFeaturesFromKML_(data);
                        setImportedAOI_(uploadedFeatures);
                    }
                    else if (file.name.substr(-3) === 'zip') {
                        // Use the Shapefile.js library to read the zipped Shapefile (with GeoJSON as output)
                        shp(data).then(function(geojson){
                            var uploadedFeatures = getFeaturesFromGeoJSON_(geojson);
                            setImportedAOI_(uploadedFeatures);
                        });
                    }
                };
                if (file.name.substr(-4) === 'json') {
                    fileReader.readAsText(file);
                }
                else if (file.name.substr(-3) === 'kml') {
                    fileReader.readAsText(file);
                }
                else if (file.name.substr(-3) === 'zip') {
                    fileReader.readAsArrayBuffer(file);
                }
                else {
                    vm.isImportError = true;
                }
            }
        };

        /**
         * Set the AOI to the imported AOI
         * @param features
         * @private
         */
        function setImportedAOI_(features){
            vm.isImportedAOI = true;
            vm.isDrawnAOI = false;
            projectService.setAOI(features);
            aoiService.setFeatures(features);
            aoiService.zoomToExtent();
        }

        /**
         * Get OL features from GeoJSON
         * @param data
         * @returns {Array.<ol.Feature>}
         * @private
         */
        function getFeaturesFromGeoJSON_(data){
            var format = new ol.format.GeoJSON();
            var features = format.readFeatures(data, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });
            return features;
        }

        /**
         * Get OL features from GeoJSON
         * @param data
         * @returns {Array.<ol.Feature>}
         * @private
         */
        function getFeaturesFromKML_(data){
            var format = new ol.format.KML({
                extractStyles: false,
                showPointNames: false
            });
            var features = format.readFeatures(data, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });
            return features;
        }

        /**
         *  Lets the user draw an area (polygon).
         *  After drawing it, the polygon is validated before splitting the intersecting
         *  tasks into smaller tasks
         */
        vm.drawAndSplitArea = function () {
            var map = mapService.getOSMMap();

            // Draw and select interaction - Polygon
            var drawAndSelectPolygon = new ol.interaction.Draw({
                type: "Polygon"
            });
            drawAndSelectPolygon.setActive(true);
            map.addInteraction(drawAndSelectPolygon);

            // After drawing the polygon, validate it and split if valid
            drawAndSelectPolygon.on('drawend', function (event) {
                var aoiValidationResult = projectService.validateAOI([event.feature]);
                // Start an Angular digest cycle manually to update the view
                $scope.$apply(function () {
                    vm.isSplitPolygonValid = aoiValidationResult.valid;
                    vm.splitPolygonValidationMessage = aoiValidationResult.message;
                    if (vm.isSplitPolygonValid) {
                        projectService.splitTasks(event.feature);
                        // Get the number of tasks in project
                        vm.numberOfTasks = projectService.getNumberOfTasks();
                        drawAndSelectPolygon.setActive(false);
                    }
                });
            });
        };

        /**
         * Create a new project with a project name
         */
        vm.createProject = function(){
            vm.createProjectFail = false;
            vm.createProjectSuccess = false;
            if (vm.projectNameForm.$valid){
                var resultsPromise = projectService.createProject(vm.projectName);
                resultsPromise.then(function (data) {
                    // Project created successfully
                    vm.createProjectFail = false;
                    vm.createProjectSuccess = true;
                    // Navigate to the edit project page
                    
                    $location.path('/admin/edit-project').search({
                        name: vm.projectName,
                        id: data.projectId
                    });
                }, function(){
                    // Project not created successfully
                    vm.createProjectFail = true;
                    vm.createProjectSuccess = false;
                });
            }
            else {
                vm.projectNameForm.submitted = true;
            }
        };

        /**
         * Adds a geocoder control to the map
         * It is using an OpenLayers plugin control
         * For more info and options, please see https://github.com/jonataswalker/ol3-geocoder
         * @private
         */
        function addGeocoder_(){

            var map =  mapService.getOSMMap();

            // Initialise the geocoder
            var geocoder = new Geocoder('nominatim', {
                provider: 'osm',
                lang: 'en',
                placeholder: 'Search for ...',
                targetType: 'glass-button',
                limit: 5,
                keepOpen: true,
                preventDefault: true
            });
            map.addControl(geocoder);

            // By setting the preventDefault to false when initialising the Geocoder, you can add your own event
            // handler which has been done here.
            geocoder.on('addresschosen', function(evt){
                map.getView().setCenter(evt.coordinate);
                // It is assumed that most people will search for cities. Zoom level 12 seems most appropriate
                map.getView().setZoom(12);
            });
        }
    }
})();
