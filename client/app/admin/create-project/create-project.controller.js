(function () {

    'use strict';

    /**
     * Create project controller which manages creating a new project
     */
    angular
        .module('taskingManager')
        .controller('createProjectController', ['mapService', 'drawService', 'projectService', createProjectController]);

    function createProjectController(mapService, drawService, projectService) {
        var vm = this;
        vm.currentStep = '';
        vm.AOIRequired = true;
        vm.AOI = null;
        vm.DEFAULT_ZOOM_LEVEL_OFFSET = 2;
        vm.sizeOfTasks = 0;
        vm.numberOfTasks = 0;

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
                drawService.removeAllFeatures();
            }
            if (wizardStep === 'tasks') {
                vm.AOI = drawService.getFeatures();
                var numberOfFeatures = drawService.getFeatures().length;
                if (numberOfFeatures > 0) {
                    vm.AOIRequired = false;
                    vm.currentStep = wizardStep;
                    drawService.setDrawPolygonActive(false);
                    // Remove existing task grid
                    projectService.removeTaskGrid();
                }
                else {
                    vm.AOIRequired = true;
                }
            }
            if (wizardStep === 'taskSize'){
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
        vm.createTaskGrid = function(zoomLevelOffset){

            // Remove existing task grid
            projectService.removeTaskGrid();

            // Get the zoom level
            var zoomLevel = mapService.getOSMMap().getView().getZoom() + vm.DEFAULT_ZOOM_LEVEL_OFFSET;

             // Get the AOI
            var areaOfInterest = vm.AOI;

            // Create a task grid
            projectService.createTaskGrid(areaOfInterest[0], zoomLevel + zoomLevelOffset);

            // Get the number of tasks in project
            vm.numberOfTasks = projectService.getNumberOfTasks();

            // Get the size of the tasks - all task squares are the same size so pick the first one
            // TODO: only do this when using a square grid
            vm.sizeOfTasks = projectService.getTaskSize();

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
