(function () {

    'use strict';

    /**
     * Create project controller which manages creating a new project
     */
    angular
        .module('taskingManager')
        .controller('createProjectController', ['mapService', 'drawService', createProjectController]);

    function createProjectController(mapService, drawService) {
        var vm = this;
        vm.currentStep = '';
        vm.AOIRequired = true;

        activate();

        function activate() {
            vm.currentStep = 'area';
       
            mapService.createOSMMap('map');
            drawService.initDrawTools();
        }

        /**
         * Set the current step
         * @param step
         */
        vm.setStep = function(step){
            if (step === 'tasks'){
                var numberOfFeatures = drawService.getNumberOfFeatures();
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
        }
    }
})();
