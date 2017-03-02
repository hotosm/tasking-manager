(function () {

    'use strict';

    /**
     * Create project controller which manages creating a new project
     */
    angular
        .module('taskingManager')
        .controller('createProjectController', ['$scope', 'mapService', 'drawService', 'projectService', createProjectController]);

    function createProjectController($scope, mapService, drawService, projectService) {
        var vm = this;

        // Wizard variables
        vm.currentStep = '';
        vm.isTaskGrid = false;
        vm.isTaskArbitrary = false;

        // AOI variables
        vm.AOIValid = true;
        vm.AOIValidationMessage = '';
        vm.AOI = null;

        // Grid variables
        vm.sizeOfTasks = 0; 
        vm.MAX_SIZE_OF_TASKS = 1000; //in square kilometers
        vm.numberOfTasks = 0;
        vm.MAX_NUMBER_OF_TASKS = 1500;

        // Variables for the zoom level used for creating the grid
        vm.DEFAULT_ZOOM_LEVEL_OFFSET = 2;
        vm.initialZoomLevelForTaskGridCreation = 0;
        vm.userZoomLevelOffset = 0;

        // Validation
        vm.AOIValid = false;
        vm.AOIValidationMessage = '';
        vm.isSplitPolygonValid = true;
        vm.splitPolygonValidationMessage = '';

        activate();

        function activate() {
            vm.currentStep = 'area';

            mapService.createOSMMap('map');
            drawService.initDrawTools();
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
                drawService.removeAllFeatures();
                projectService.removeTaskGrid();
                vm.currentStep = wizardStep;
            }
            else if (wizardStep === 'tasks'){

                var aoiValidationResult = projectService.validateAOI(drawService.getFeatures());
                vm.AOIValid = aoiValidationResult.valid;
                vm.AOIValidationMessage = aoiValidationResult.message;

                if (vm.AOIValid) {
                    drawService.setDrawPolygonActive(false);
                    drawService.zoomToExtent();
                    // Use the current zoom level + a standard offset to determine the default task grid size for the AOI
                    vm.zoomLevelForTaskGridCreation = mapService.getOSMMap().getView().getZoom()
                        + vm.DEFAULT_ZOOM_LEVEL_OFFSET;
                    // Reset the user zoom level offset
                    vm.userZoomLevelOffset = 0;
                    vm.currentStep = wizardStep;
                }
            }
            else if (wizardStep === 'taskSize'){
                var grid = projectService.getTaskGrid();
                if (grid){
                    vm.currentStep = wizardStep;
                }
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
            if (!drawService.getDrawPolygonActive()){
                drawService.setDrawPolygonActive(true);
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
            var areaOfInterest = drawService.getFeatures();
            projectService.setAOI(areaOfInterest);

            // Create a task grid
            // TODO: may need to fix areaOfInterest[0] as it may need to work for multipolygons
            var taskGrid = projectService.createTaskGrid(areaOfInterest[0], vm.zoomLevelForTaskGridCreation + vm.userZoomLevelOffset);
            projectService.setTaskGrid(taskGrid);
            projectService.addTaskGridToMap();

            // Get the number of tasks in project
            vm.numberOfTasks = projectService.getNumberOfTasks();

            // Get the size of the tasks 
            // TODO: only do this when using a square grid
            vm.sizeOfTasks = projectService.getTaskSize();
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
