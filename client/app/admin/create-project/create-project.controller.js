(function () {

    'use strict';

    /**
     * Create project controller which manages creating a new project
     */
    angular
        .module('taskingManager')
        .controller('createProjectController', ['mapService', 'drawService', 'gridService', createProjectController]);

    function createProjectController(mapService, drawService, gridService) {
        var vm = this;
        vm.currentStep = '';
        vm.AOIRequired = true;

        activate();

        function activate() {
            vm.currentStep = 'area';

            mapService.createOSMMap('map');
            drawService.initDrawTools();
            addGeocoder_();
        }

        /**
         * Set the current step
         * @param step
         */
        vm.setStep = function(step){
            if (step === 'tasks'){
                var numberOfFeatures = drawService.getFeatures().length;
                if (numberOfFeatures > 0){
                    vm.AOIRequired = false;
                    vm.currentStep = step;
                    drawService.setDrawPolygonActive(false);
                }
                else {
                    vm.AOIRequired = true;
                }
            }
            else {
                vm.currentStep = step;
            }
        };

        /**
         * Decides if a step should be shown as completed in the progress bar
         * @param step
         * @returns {boolean}
         */
        vm.showStep = function(step){
            var showStep = false;
            if (step === 'area'){
                if (vm.currentStep === 'area' || vm.currentStep === 'tasks' || vm.currentStep === 'templates' || vm.currentStep === 'review'){
                    showStep = true;
                }
            }
            else if (step === 'tasks'){
                if ( vm.currentStep === 'tasks' || vm.currentStep === 'templates' || vm.currentStep === 'review'){
                    showStep = true;
                }
            }
            else if (step === 'templates'){
                if (vm.currentStep === 'templates' || vm.currentStep === 'review'){
                    showStep = true;
                }
            }
            else if (step === 'review'){
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
         * Create a grid
         */
        vm.createGrid = function(){
            // Get the zoom level
            var zoom = mapService.getOSMMap().getView().getZoom();

             // Get the AOI in GeoJSON
            var areaOfInterest = drawService.getFeatures();

            // Call the grid service to generate tiles 
            var sizeOfTasks = 3; // TODO: define the task sizes. This generates 'medium' tasks as in TM2
            var taskGeometries = gridService.getTaskFeaturesInAOIFeature(areaOfInterest[0], zoom + sizeOfTasks);
            
            // Add the task geometries
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
