(function () {

    'use strict';

    /**
     * Create project controller which manages creating a new project
     */
    angular
        .module('taskingManager')
        .controller('createProjectController', [createProjectController]);

    function createProjectController() {
        var vm = this;
        vm.currentStep = '';

        activate();

        function activate() {
            vm.currentStep = 'area';
            
            // TODO: move to map service
            var map = new ol.Map({
                layers: [
                    new ol.layer.Tile({
                        source: new ol.source.OSM()
                    })
                ],
                target: 'map',
                view: new ol.View({
                    center: [0, 0],
                    zoom: 2
                })
            });

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

            geocoder.on('addresschosen', function(evt){
                map.getView().setCenter(evt.coordinate);
                map.getView().setZoom(12);
            });
        }

        /**
         * Set the current step
         * @param step
         */
        vm.setStep = function(step){
            vm.currentStep = step;
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
        }

        function addGeocoder(){

        }
    }
})();
