(function () {

    'use strict';

    /**
     * Edit project controller which manages editing an existing project
     */
    angular
        .module('taskingManager')
        .controller('editProjectController', ['$scope', '$location','mapService','drawService', 'projectService', editProjectController]);

    function editProjectController($scope, $location, mapService, drawService, projectService) {
        var vm = this;
        vm.currentSection = '';

        // Mapping
        vm.map = null;

        // Priority areas: interactions
        vm.modifyInteraction = null;
        vm.drawPolygonInteraction = null;
        vm.drawRectangleInteraction = null;
        vm.drawCircleInteraction = null;
        vm.selectInteraction = null;
    
        vm.editPriority = false;
        vm.deletePriority = false;
        
        vm.numberOfPriorityAreas = 0;

        // Locale
        vm.languages = [
            '...', 'es', 'en'
        ];

        // TODO: get project metadata from API
        vm.project = {
            id: null,
            name: '',
            status: 'DRAFT',
            priority: 'MEDIUM',
            shortDescription: 'test', // TODO: different languages
            description: '',
            instructions: '',
            taskInstructions: ''
        };
        
        activate();

        function activate() {
            vm.currentSection = 'description';
            vm.project.id = $location.search().id;
            vm.project.name = $location.search().name;
            mapService.createOSMMap('map');
            vm.map = mapService.getOSMMap();

            // Priority areas: initialise the draw service with interactions
            drawService.initInteractions(true, true, true, true, true, true);

            // Get the interactions in the controller so events can be handled
            vm.source = drawService.getSource();
            vm.modifyInteraction = drawService.getModifyInteraction();
            vm.drawPolygonInteraction = drawService.getDrawPolygonInteraction();
            vm.drawRectangleInteraction = drawService.getDrawRectangleInteraction();
            vm.drawCircleInteraction = drawService.getDrawCircleInteraction();
            vm.selectInteraction = drawService.getSelectInteraction();
            vm.translateInteraction = drawService.getTranslateInteraction();

            // Add select interaction handler
            setSelectInteractionEventHandler_();

            // Add vector source event handler for adding and removing features
            setVectorSourceEventHandlers_();
        }

        /**
         * Cancel edits
         */
        vm.cancelEdits = function(){
            //TODO: navigate to the project page
        };

        /**
         * Save edits
         */
        vm.saveEdits = function(){
            vm.updateProjectFail = false;
            vm.updateProjectSuccess = false;
            
            // TODO: locale
            var projectData = {
                defaultLocale: 'en',
                projectInfo: [{
                    description: vm.project.description,
                    instructions: vm.project.instructions,
                    locale: 'en',
                    name: vm.project.name,
                    shortDescription: vm.project.shortDescription
                }],
                projectName: vm.project.name,
                projectPriority: vm.project.priority,
                projectStatus: vm.project.status
            };

            var resultsPromise = projectService.updateProject(vm.project.id, projectData);
            resultsPromise.then(function (data) {
                // Project updated successfully
                vm.updateProjectFail = false;
                vm.updateProjectSuccess = true;
                // Navigate to the project page
                $location.path('/project').search({
                    projectid: vm.project.id
                });
            }, function(){
                // Project not updated successfully
                vm.updateProjectFail = true;
                vm.updateProjectSuccess = false;
            });
        };

        /**
         * Change language
         */
        vm.changeLanguage = function() {
            console.log("change language");
        };

        /**
         * Priority areas: draw a polygon as a priority area
         */
        vm.drawPriorityPolygon = function(){
            setInteractionsInactive_();
            vm.drawPolygonInteraction.setActive(true);
        };

        /**
         * Priority areas: draw a rectangle as a priority area
         */
        vm.drawPriorityRectangle = function(){
            setInteractionsInactive_();
            vm.drawRectangleInteraction.setActive(true);
        };

        /**
         * Priority areas: draw a circle as a priority area
         */
        vm.drawPriorityCircle = function(){
            setInteractionsInactive_();
            vm.drawCircleInteraction.setActive(true);
        };

        /**
         * Priority areas: edit a priority area
         */
        vm.editPriorityArea = function(){
            setInteractionsInactive_();
            vm.editPriority = true;
            vm.selectInteraction.setActive(true);
            vm.modifyInteraction.setActive(true);
            vm.translateInteraction.setActive(true);
        };

        /**
         * Priority areas: delete a priority area
         */
        vm.deletePriorityArea = function(){
            setInteractionsInactive_();
            vm.deletePriority = true;
            vm.selectInteraction.setActive(true);
        };

        /**
         * Priority areas: set interactions to active/inactive
         * @param boolean
         * @private
         */
        function setInteractionsInactive_(){
            vm.editPriority = false;
            vm.deletePriority = false;
            vm.selectInteraction.getFeatures().clear();
            if (vm.drawPolygonInteraction){
                vm.drawPolygonInteraction.setActive(false);
            }
            if (vm.drawRectangleInteraction){
                vm.drawRectangleInteraction.setActive(false);
            }
            if (vm.drawCircleInteraction){
                vm.drawCircleInteraction.setActive(false);
            }
            if (vm.selectInteraction){
                vm.selectInteraction.setActive(false);
            }
            if (vm.modifyInteraction){
                vm.modifyInteraction.setActive(false);
            }
            if (vm.translateInteraction){
                vm.translateInteraction.setActive(false);
            }
        }

        /**
         * Priority areas: set the event handler for the select interaction
         * @private
         */
        function setSelectInteractionEventHandler_(){
            vm.selectInteraction.on('select', function (event){
                if (vm.translateInteraction.getActive()){
                    // Move feature on select
                    // The translate interaction handles this
                }
                else {
                    // Delete feature on select
                    var features = vm.source.getFeaturesAtCoordinate(event.mapBrowserEvent.coordinate);
                    if (features){
                        vm.source.removeFeature(features[0]);
                        vm.selectInteraction.getFeatures().clear();
                    }
                }
            });
        }

        /**
         * Priority areas: set the vector source event handlers for adding and removing features
         * @private
         */
        function setVectorSourceEventHandlers_(){
            vm.source.on('addfeature', function(){
                $scope.$apply(vm.numberOfPriorityAreas++);
            });
            vm.source.on('removefeature', function(){
                $scope.$apply(vm.numberOfPriorityAreas--);
            });
        }
    }
})();
