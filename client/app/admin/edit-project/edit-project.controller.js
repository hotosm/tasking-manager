(function () {

    'use strict';

    /**
     * Edit project controller which manages editing an existing project
     */
    angular
        .module('taskingManager')
        .controller('editProjectController', ['$scope', '$location', '$routeParams', '$showdown', 'mapService','drawService', 'projectService', editProjectController]);

    function editProjectController($scope, $location, $routeParams, $showdown, mapService, drawService, projectService) {
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

        // Locale - TODO: get from API
        vm.locales = [
            'nl', 'en'
        ];

        vm.project = {};
        vm.descriptionLanguage = 'en';
        vm.shortDescriptionLanguage = 'en';
        vm.nameLanguage = 'en';
        vm.instructionsLanguage = 'en';

        vm.descriptionHTML = '';
        
        activate();

        function activate() {
            
            var id = $routeParams.id;

            getProjectMetadata(id);

            vm.currentSection = 'description';

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
         * Save edits
         */
        vm.saveEdits = function(){

            vm.updateProjectFail = false;
            vm.updateProjectSuccess = false;

            // Prepare the data for sending to API by removing any locales with no fields
            // TODO: move to service
            for (var i = 0; i < vm.project.projectInfoLocales.length; i++){
                var info = vm.project.projectInfoLocales[i];
                var populatedLocale = false;

                if (info.description !== '' || info.shortDescription !== '' || info.name !== '' || info.instructions !== ''){
                    // Convert to HTML using the showdown library
                    info.description = $showdown.makeHtml(info.description);
                    info.shortDescription = $showdown.makeHtml(info.shortDescription);
                    info.instructions = $showdown.makeHtml(info.instructions);
                    populatedLocale = true;
                }

                // if no fields for this locale are populated, remove from array
                if (!populatedLocale){
                    vm.project.projectInfoLocales.splice(i, 1);
                    // decrease the counter because there is one less item in the array
                    i--;
                }
            }
            vm.project.defaultLocale = 'en';

            var resultsPromise = projectService.updateProject(vm.project.projectId, vm.project);
            resultsPromise.then(function (data) {
                // Project updated successfully
                vm.updateProjectFail = false;
                vm.updateProjectSuccess = true;
                // Reset the page elements 
                activate();
            }, function(){
                // Project not updated successfully
                vm.updateProjectFail = true;
                vm.updateProjectSuccess = false;
            });
        };

        /**
         * Change the language of the description
         * @param language
         */
        vm.changeLanguageDescription = function(language){
            vm.descriptionLanguage = language;
        };
        
        /**
         * Change the language of name field
         * @param language
         */
        vm.changeLanguageName = function(language){
            vm.nameLanguage = language;
        };

        /**
         * Change the language short description field
         */
        vm.changeLanguageShortDescription = function(language) {
            vm.shortDescriptionLanguage = language;
        };

        /**
         * Change the language instructions field
         * @param language
         */
        vm.changeLanguageInstructions = function(language) {
            vm.instructionsLanguage = language;
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

        /**
         * Get project metadata
         * @param id
         */
        function getProjectMetadata(id){
            var resultsPromise = projectService.getProjectMetadata(id);
            resultsPromise.then(function (data) {
                vm.project = data;
                // only 'non-empty' locales are included so add empty locales to ease editing
                // TODO: move to separate service?
                for (var i = 0; i < vm.locales.length; i++){
                    var found = false;
                    for (var j = 0; j < vm.project.projectInfoLocales.length; j++){
                        if (vm.locales[i] === vm.project.projectInfoLocales[j].locale){
                            // Convert to markdown using the to-markdown library
                            vm.project.projectInfoLocales[j].description = toMarkdown(vm.project.projectInfoLocales[j].description);
                            vm.project.projectInfoLocales[j].shortDescription = toMarkdown(vm.project.projectInfoLocales[j].shortDescription);
                            vm.project.projectInfoLocales[j].instructions = toMarkdown(vm.project.projectInfoLocales[j].instructions);
                            found = true;
                            break;
                        }
                    }
                    if (!found){
                        // Add an empty projectInfoLocale
                        var locale = {
                            "locale": vm.locales[i],
                            "name": "",
                            "shortDescription": "",
                            "description": "",
                            "instructions": ""
                        };
                        vm.project.projectInfoLocales.push(locale);
                    }
                }
            }, function(){
               // TODO
            });
        }
    }
})();
