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
        vm.AOIValid = true;
        vm.AOIValidationMessage = '';

        activate();

        function activate() {
            vm.currentStep = 'area';

            mapService.createOSMMap('map');
            drawService.initDrawTools();
            addGeocoder_();
        }

        /**
         * Set the current wizard step in the process of creating a project
         * @param wizardStep the step in the wizard the user wants to go to
         */
        vm.setWizardStep = function(wizardStep){
            if (wizardStep === 'tasks'){

                var aoiValidationResult = projectService.validateAOI(drawService.getFeatures());
                vm.AOIValid = aoiValidationResult.valid;
                vm.AOIValidationMessage = aoiValidationResult.message;

                if(vm.AOIValid){
                    vm.currentStep = wizardStep;
                    drawService.setDrawPolygonActive(false);
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
                if (vm.currentStep === 'area' || vm.currentStep === 'tasks' || vm.currentStep === 'templates' || vm.currentStep === 'review'){
                    showStep = true;
                }
            }
            else if (wizardStep === 'tasks'){
                if ( vm.currentStep === 'tasks' || vm.currentStep === 'templates' || vm.currentStep === 'review'){
                    showStep = true;
                }
            }
            else if (wizardStep === 'templates'){
                if (vm.currentStep === 'templates' || vm.currentStep === 'review'){
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
            // Get the zoom level
            var zoomLevel = mapService.getOSMMap().getView().getZoom();

             // Get the AOI
            var areaOfInterest = drawService.getFeatures();

            // Get the task grid from the project service 
            var sizeOfTasks = 3; // TODO: define the task sizes. This generates 'medium' tasks as in TM2
            var taskGeometries = projectService.getTaskGrid(areaOfInterest[0], zoomLevel + sizeOfTasks); // TODO: may need to fix areaOfInterest[0] as it may need to work for multipart polgons
            
            // Add the task features to the map
            drawService.addFeatures(taskGeometries);
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
