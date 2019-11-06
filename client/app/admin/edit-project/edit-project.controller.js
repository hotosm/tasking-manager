(function () {

    'use strict';

    /**
     * Edit project controller which manages editing an existing project
     */
    angular
        .module('taskingManager')
        .controller('editProjectController', ['$scope', '$location', '$routeParams', '$timeout', 'mapService','drawService', 'projectService', 'geospatialService','accountService', 'authService', 'tagService', 'licenseService','userService','messageService','settingsService', 'configService', 'editorService', editProjectController]);

    function editProjectController($scope, $location, $routeParams, $timeout, mapService, drawService, projectService, geospatialService, accountService, authService, tagService, licenseService, userService, messageService, settingsService, configService, editorService) {

        var vm = this;
        vm.currentSection = '';
        vm.editForm = {};

        // Priority areas: interactions
        vm.map = null;
        vm.modifyInteraction = null;
        vm.drawPolygonInteraction = null;
        vm.drawRectangleInteraction = null;
        vm.drawCircleInteraction = null;
        vm.selectInteraction = null;

        vm.editPriority = false;
        vm.deletePriority = false;

        vm.numberOfPriorityAreas = 0;

        // Locale
        vm.locales = [];

        // Types of mapping
        vm.mappingTypes = {
            buildings: false,
            roads: false,
            waterways: false,
            landuse: false,
            other: false
        };

        // Editors for mapping
        vm.mappingEditors = {
            id: false,
            josm: false,
            potlatch2: false,
            fieldpapers: false,
            custom: false
        };

        // Editors for validation
        vm.validationEditors = {
            id: false,
            josm: false,
            potlatch2: false,
            fieldpapers: false,
            custom: false
        };
        // Setup iD editor presets associated with each mapping type
        vm.mappingTypePresets = {
            buildings: editorService.idPresetCategories['category-building'].members,
            roads: editorService.idPresetCategories['category-road_major'].members.concat(
                   editorService.idPresetCategories['category-road_minor'].members),
            waterways: editorService.idPresetCategories['category-waterway'].members,
            landuse: editorService.idPresetCategories['category-landuse'].members,
        };

        // Setup "other" mapping type with all other presets
        var usedPresets = []
        Object.keys(vm.mappingTypePresets).forEach(function(mappingType) {
            usedPresets = usedPresets.concat(vm.mappingTypePresets[mappingType]);
        });
        vm.mappingTypePresets.other = editorService.allIdPresets().filter(function(preset) {
            return usedPresets.indexOf(preset) === -1;
        });

        // Chosen iD editor presets
        vm.limitPresets = !!configService.idPresetsLimitedByDefault;
        vm.selectedPresets = {};
        vm.presetsFilter = "";

        // Tags
        vm.organisationTags = [];
        vm.campaignsTags = [];
        vm.projectOrganisationTag = [];
        vm.projectCampaignTag = [];

        vm.project = {};
        vm.project.defaultLocale = 'en';
        vm.descriptionLanguage = 'en';
        vm.shortDescriptionLanguage = 'en';
        vm.nameLanguage = 'en';
        vm.instructionsLanguage = 'en';
        vm.perTaskInstructionsLanguage = 'en';

        vm.descriptionHTML = '';

        // Delete
        vm.showDeleteConfirmationModal = false;

        // Transfer
        vm.showTransferConfirmationModal = false;
        vm.transferProjectTo= []; //it's a list because it uses the tag input

        // Reset
        vm.showResetConfirmationModal = false;

        // Private project/add users
        vm.addUserEnabled = false;

        // Error messages
        vm.deleteProjectFail = false;
        vm.deleteProjectSuccess = false;
        vm.transferProjectFail = false;
        vm.transferProjectSuccess = false;
        vm.showTransferEmptyUserError = false;
        vm.resetProjectFail = false;
        vm.resetProjectSuccess = false;
        vm.invalidateTasksFail = false;
        vm.invalidateTasksSuccess = false;
        vm.validateTasksFail = false;
        vm.validateTasksSuccess = false;

        // Messages
        vm.messageSubject = '';
        vm.messageContent = '';

        // Form
        vm.form = {};

        // User info
        vm.userRole = '';
        vm.userIsExpert = false;

        // Custom Editor
        vm.customEditor = null;

        activate();

        function activate() {

            // Get available languages
            var resultsPromise = settingsService.getSettings();
            resultsPromise.then(function (data) {
                for (var i = 0; i < data.supportedLanguages.length; i++){
                    vm.locales.push(data.supportedLanguages[i].code);
                }
            });

            // Check if the user has the PROJECT_MANAGER or ADMIN role. If not, redirect
            var session = authService.getSession();
            if (session){
                var resultsPromise = accountService.getUser(session.username);
                resultsPromise.then(function (user) {
                    vm.userRole = user.role;
                    vm.userIsExpert = user.isExpert;

                    // Returned the user successfully. Check the user's role
                    if (user.role !== 'PROJECT_MANAGER' && user.role !== 'ADMIN'){
                        $location.path('/');
                    }
                }, function(){
                    // an error occurred, navigate to homepage
                    $location.path('/');
                });
            }

            var id = $routeParams.id;

            // Initialise the map and add interactions
            mapService.createOSMMap('map');
            vm.map = mapService.getOSMMap();
            addInteractions();
            setOrganisationTags();
            setCampaignTags();

            getProjectMetadata(id);

            vm.currentSection = 'description';
        }

        /**
         * Save edits
         */
        vm.saveEdits = function(){

            // Format priority areas
            var priorityAreaFeatures = vm.source.getFeatures();
            var priorityAreas = [];
            for (var i = 0; i < priorityAreaFeatures.length; i++){
                var priorityArea = geospatialService.getGeoJSONObjectFromFeature(priorityAreaFeatures[i]);
                priorityAreas.push(priorityArea.geometry);
            }
            vm.project.priorityAreas = priorityAreas;

            vm.updateProjectFail = false;
            vm.updateProjectSuccess = false;

            // Only check required fields when publishing
            if (vm.project.projectStatus === 'PUBLISHED') {
                var requiredFieldsMissing = checkRequiredFields();
            }

            // Remove the area of interest before posting it back
            delete vm.project.areaOfInterest;

            // Only one tag is allowed at the moment so get the first item
            vm.project.organisationTag = null;
            vm.project.campaignTag = null;
            if (vm.projectOrganisationTag[0]) {
                vm.project.organisationTag = vm.projectOrganisationTag[0].text;
            }
            if (vm.projectCampaignTag[0]) {
                vm.project.campaignTag = vm.projectCampaignTag[0].text;
            }
            if (vm.projectLicense){
                vm.project.licenseId = vm.projectLicense.licenseId;
            }
            else {
                vm.project.licenseId = null;
            }

            vm.project.customEditor = vm.customEditor;

            // Prepare the data for sending to API by removing any locales with no fields
            if (!requiredFieldsMissing && vm.editForm.$valid){
                vm.project.mappingTypes = vm.getMappingTypesArray();
                vm.project.idPresets = vm.getIdPresets();
                vm.project.mappingEditors = getMappingEditorsArray();
                vm.project.validationEditors = getValidationEditorsArray();
                vm.project.josmPreset = vm.josmPreset;
                for (var i = 0; i < vm.project.projectInfoLocales.length; i++){
                    var info = vm.project.projectInfoLocales[i];
                    var populatedLocale = false;
                    if (info.description !== '' || info.shortDescription !== '' || info.name !== '' || info.instructions !== '' || info.perTaskInstructions != '') {
                        populatedLocale = true;
                    }
                    // if no fields for this locale are populated, remove from array
                    if (!populatedLocale) {
                        vm.project.projectInfoLocales.splice(i, 1);
                        // decrease the counter because there is one less item in the array
                        i--;
                    }
                }
                var resultsPromise = projectService.updateProject(vm.project.projectId, vm.project);
                resultsPromise.then(function (data) {
                    // Project updated successfully
                    vm.updateProjectFail = false;
                    vm.updateProjectSuccess = true;
                    // Reset the page elements
                    getProjectMetadata(vm.project.projectId);
                }, function () {
                    // Project not updated successfully
                    vm.updateProjectFail = true;
                    vm.updateProjectSuccess = false;
                });
            }
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
         * Change the language per task instructions field
         * @param language
         */
        vm.changeLanguagePerTaskInstructions = function(language){
            vm.perTaskInstructionsLanguage = language;
        };

        /**
         * Change the default locale
         * @param language
         */
        vm.changeDefaultLocale = function(language){
            vm.project.defaultLocale = language;
            vm.nameMissing = false;
            vm.descriptionMissing = false;
            vm.shortDescriptionMissing = false;
            vm.instructionsMissing = false;
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
         * Priority areas: delete all priority areas
         */
        vm.clearAllPriorityAreas = function(){
            setInteractionsInactive_();
            vm.source.clear();
        };

        /**
         * Set the project mapper level
         * @param level
         */
        vm.setMapperLevel = function(level){
            vm.project.mapperLevel = level;
        };

        /**
         * Navigate to the homepage
         */
        vm.goToHome = function(){
            $location.path('/');
        };

        /**
         * Navigate to the project detail
         */
        vm.goToProjectDetail = function(){
            $location.path('/project/' + vm.project.projectId);
        };

        /**
         * Set the delete confirmation modal to visible/invisible
         * @param showModal
         */
        vm.showDeleteConfirmation = function(showModal){
            vm.showDeleteConfirmationModal = showModal;
            if (!showModal && vm.deleteProjectSuccess){
                $location.path('/');
            }
        };

        /**
         * Delete a project
         */
        vm.deleteProject = function(){
            vm.deleteProjectFail = false;
            vm.deleteProjectSuccess = false;
            var resultsPromise = projectService.deleteProject(vm.project.projectId);
            resultsPromise.then(function () {
                // Project deleted successfully
                vm.deleteProjectFail = false;
                vm.deleteProjectSuccess = true;
                // Reset the page elements
                getProjectMetadata(vm.project.projectId);
            }, function(){
                // Project not deleted successfully
                vm.deleteProjectFail = true;
                vm.deleteProjectSuccess = false;
            });
        };

        /**
         * Set the transfer confirmation modal to visible/invisible
         * @param showModal
         */
        vm.showTransferConfirmation = function(showModal){
            if (vm.transferProjectTo.length && vm.editForm.$valid){
                vm.showTransferConfirmationModal = showModal;
                vm.showTransferEmptyUserError = false;
                if (!showModal && vm.transferProjectSuccess){
                    $location.path('/project/' + vm.project.projectId);
                }
            } else {
                vm.showTransferEmptyUserError = true;
            }
        };

        /**
         * Transfer a project
         */
        vm.transferProject = function(){
            vm.transferProjectFail = false;
            vm.transferProjectSuccess = false;
            var resultsPromise = projectService.transferProject(vm.project.projectId, vm.transferProjectTo[0].text);
            resultsPromise.then(function () {
                // Project deleted successfully
                vm.transferProjectFail = false;
                vm.transferProjectSuccess = true;
                // Reset the page elements
                getProjectMetadata(vm.project.projectId);
            }, function(){
                // Project not deleted successfully
                vm.transferProjectFail = true;
                vm.transferProjectSuccess = false;
            });
        };

        /**
         * Set the map confirmation modal to visible/invisible
         * @param showModal
         */
        vm.showMapConfirmation = function(showModal){
            vm.showMapConfirmationModal = showModal;
        };

        /**
         * Map all tasks on a project
         */
        vm.mapAllTasks = function(){
            vm.mapInProgress = true;
            vm.mapTasksFail = false;
            vm.mapTasksSuccess = false;
            var resultsPromise = projectService.mapAllTasks(vm.project.projectId);
            resultsPromise.then(function(){
                // Tasks mapped successfully
                vm.mapTasksFail = false;
                vm.mapTasksSuccess = true;
                vm.mapInProgress = false;
            }, function(){
                // Tasks not mapped successfully
                vm.mapTasksFail = true;
                vm.mapTasksSuccess = false;
                vm.mapInProgress = false;
            })
        };

        /**
         * Set the reset bad imagery confirmation modal to visible/invisible
         * @param showModal
         */
        vm.showResetBadImageryConfirmation = function(showModal){
            vm.showResetBadImageryConfirmationModal = showModal;
        };

        /**
         * Reset all bad imagery tasks on a project
         */
        vm.resetBadImageryTasks = function(){
            vm.resetBadImageryInProgress = true;
            vm.resetBadImageryFail = false;
            vm.resetBadImagerySuccess = false;
            var resultsPromise = projectService.resetBadImageryTasks(vm.project.projectId);
            resultsPromise.then(function(){
                // Tasks mapped successfully
                vm.resetBadImageryFail = false;
                vm.resetBadImagerySuccess = true;
                vm.resetBadImageryInProgress = false;
            }, function(){
                // Tasks not mapped successfully
                vm.resetBadImageryFail = true;
                vm.resetBadImagerySuccess = false;
                vm.resetBadImageryInProgress = false;
            })
        };

        /*
         * Set the reset confirmation modal to visible/invisible
         * @param showModal
         */
        vm.showResetConfirmation = function(showModal){
            vm.showResetConfirmationModal = showModal;
            if (!showModal && vm.resetProjectSuccess){
                $location.path('/');
            }
        };

        /**
         * Reset a project
         */
        vm.resetProject = function(){
            vm.resetProjectFail = false;
            vm.resetProjectSuccess = false;
            var resultsPromise = projectService.resetProject(vm.project.projectId);
            resultsPromise.then(function () {
                // Project reset successfully
                vm.resetProjectFail = false;
                vm.resetProjectSuccess = true;
                // Reset the page elements
                getProjectMetadata(vm.project.projectId);
            }, function(){
                // Project not reset successfully
                vm.resetProjectFail = true;
                vm.resetProjectSuccess = false;
            });
        };

        /**
         * Set the invalidate confirmation modal to visible/invisible
         * @param showModal
         */
        vm.showInvalidateConfirmation = function(showModal){
            vm.showInvalidateConfirmationModal = showModal;
        };

        /**
         * Invalidate all tasks on a project
         */
        vm.invalidateAllTasks = function(){
            vm.invalidateInProgress = true;
            vm.invalidateTasksFail = false;
            vm.invalidateTasksSuccess = false;
            var resultsPromise = projectService.invalidateAllTasks(vm.project.projectId);
            resultsPromise.then(function (){
                // Tasks invalidated successfully
                vm.invalidateTasksFail = false;
                vm.invalidateTasksSuccess = true;
                vm.invalidateInProgress = false;
            }, function(){
                // Tasks not invalidated successfully
                vm.invalidateTasksFail = true;
                vm.invalidateTasksSuccess = false;
                vm.invalidateInProgress = false;
            })
        };

        /**
         * Set the validate confirmation modal to visible/invisible
         * @param showModal
         */
        vm.showValidateConfirmation = function(showModal){
            vm.showValidateConfirmationModal = showModal;
        };

        /**
         * Validate all tasks on a project
         */
        vm.validateAllTasks = function(){
            vm.validateInProgress = true;
            vm.validateTasksFail = false;
            vm.validateTasksSuccess = false;
            var resultsPromise = projectService.validateAllTasks(vm.project.projectId);
            resultsPromise.then(function(){
                // Tasks validated successfully
                vm.validateTasksFail = false;
                vm.validateTasksSuccess = true;
                vm.validateInProgress = false;
            }, function(){
                // Tasks not validated successfully
                vm.validateTasksFail = true;
                vm.validateTasksSuccess = false;
                vm.validateInProgress = false;
            })
        };

        /**
         * Reset all tasks on a project
         */
        vm.resetAllTasks = function(){
            vm.resetInProgress = true;
            vm.resetTasksFail = false;
            vm.resetTasksSuccess = false;
            var resultsPromise = projectService.resetAllTasks(vm.project.projectId);
            resultsPromise.then(function(){
                // Tasks reset successfully
                vm.resetTasksFail = false;
                vm.resetTasksSuccess = true;
                vm.resetInProgress = false;
            }, function(){
                // Tasks not reset successfully
                vm.resetTasksFail = true;
                vm.resetTasksSuccess = false;
                vm.resetInProgress = false;
            })
        };

        /**
         * Set the show message contributors modal to visible/invisible
         */
        vm.showMessageContributors = function(showModal){
            vm.showMessageContributorsModal = showModal;
        };

        /**
         * Send a message to all users on this project
         */
        vm.sendMessage = function(){
            vm.sendMessageInProgress = true;
            vm.sendMessageFail = false;
            var resultsPromise = messageService.messageAll(vm.project.projectId, vm.messageSubject, vm.messageContent);
            resultsPromise.then(function(){
                // Messages sent successfully
                vm.sendMessageFail = false;
                vm.sendMessageInProgress = false;
                vm.messageSubject = '';
                vm.messageContent = '';
                vm.showMessageContributorsModal = false;
            }, function(){
                // Messages not sent successfully
                vm.sendMessageFail = true;
                vm.sendMessageInProgress = false;
            })
        };

        /**
         * Get organisation tags
         * @returns {Array|*}
         */
        vm.getOrganisationTags = function(query){
            return vm.organisationTags.filter(function (item) {
                return (item && item.toLowerCase().indexOf(query.toLowerCase()) > -1);
            });
        };

        /**
         * Get campaign tags
          * @returns {Array|*}
          * @returns {Array|*}
         */
        vm.getCampaignTags = function(query){
            return vm.campaignTags.filter(function (item) {
                return (item && item.toLowerCase().indexOf(query.toLowerCase()) > -1);
            });
        };

        /**
         * Get the user for a search value
         * @param searchValue
         */
        vm.getUser = function(searchValue, isProjectManager){
            if (typeof isProjectManager === undefined){
                isProjectManager = false;
            }
            var resultsPromise = userService.searchUser(searchValue, vm.project.id, isProjectManager);
            return resultsPromise.then(function (data) {
                // On success
                return data.usernames;
            }, function(){
                // On error
            });
        };

        /**
         * Adds the user to the allowed user list
         * @param user
         */
        vm.addUser = function(user){
            var index = vm.project.allowedUsernames.indexOf(user);
            if (index == -1){
                vm.project.allowedUsernames.push(user);
            }
        };

        /**
         * Removes the user from the allowed user list
         * @param user
         */
        vm.removeUser = function(user){
            var index = vm.project.allowedUsernames.indexOf(user);
            if (index > -1){
                vm.project.allowedUsernames.splice(index, 1);
            }
        };

        /**
         * On private change
         */
        vm.onPrivateChange = function(){
            if (!vm.project.private){
                // clear the allowed users list when a project is not private
                vm.project.allowedUsernames = [];
            }
        };

        /**
         * Enable adding a user
         */
        vm.enableAddUser = function(boolean){
            vm.addUserEnabled = boolean;
        };

        /**
         * Returns array of all iD presets offered based on the currently selected
         * mapping types and value of the presets filter
         */
        vm.offeredPresets = function() {
          var regex = vm.presetsFilter.length > 0 ? new RegExp(vm.presetsFilter, 'i') : null;
          var presets = [];
          Object.keys(vm.mappingTypes).forEach(function(mappingType) {
              if (!vm.mappingTypes[mappingType]) {
                  return;
              }

              var mappingPresets = vm.mappingTypePresets[mappingType];
              for (var i = 0; i < mappingPresets.length; i++) {
                if (presets.indexOf(mappingPresets[i]) === -1 &&
                    (!regex || regex.test(mappingPresets[i]))) {
                      presets.push(mappingPresets[i]);
                  }
              }
          });

          presets.sort();
          return presets;
        }

        /**
         * Check the required fields for the default locale
         * @return boolean if something is missing (description, short description or instructions for the default locale
         */
        function checkRequiredFields(){
            vm.nameMissing = false;
            vm.descriptionMissing = false;
            vm.shortDescriptionMissing = false;
            vm.instructionsMissing = false;
            vm.mapperLevelMissing = false;
            vm.organisationTagMissing = false;
            vm.mappingTypeMissing = false;
            vm.presetsMissing = false;

            for (var i = 0; i < vm.project.projectInfoLocales.length; i++) {
                if (vm.project.projectInfoLocales[i].locale === vm.project.defaultLocale) {
                    // check that the name, short description, description and instructions are populated for the default locale
                    var info = vm.project.projectInfoLocales[i];
                    if (typeof info.name == 'undefined' || info.name === ''){
                        vm.nameMissing = true;
                    }
                    if (typeof info.description == 'undefined' || info.description === ''){
                        vm.descriptionMissing = true;
                    }
                    if (typeof info.shortDescription == 'undefined' || info.shortDescription === ''){
                        vm.shortDescriptionMissing = true;
                    }
                    if (typeof info.instructions == 'undefined' || info.instructions === ''){
                        vm.instructionsMissing = true;
                    }
                    if (typeof vm.projectOrganisationTag == 'undefined' || vm.projectOrganisationTag.length === 0 ){
                        vm.organisationTagMissing = true;
                    }

                    break;
                }
            }
            vm.mappingTypeMissing = vm.getMappingTypesArray().length === 0;
            vm.presetsMissing = vm.limitPresets && vm.getIdPresets().length === 0;
            var somethingMissing = vm.name || vm.descriptionMissing || vm.shortDescriptionMissing || vm.instructionsMissing || vm.organisationTagMissing || vm.mappingTypeMissing || vm.presetsMissing;
            return somethingMissing;
        }

        /**
         * Priority areas: set interactions to active/inactive
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
                // Add selected style
                // TODO: move to style service?
                var unselectedStyle =  new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255,255,255,0.6)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(255,0,0,1)', //red
                        width: 1
                    })
                });
                var selectedStyle =  new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255,255,255,0.6)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(255,0,0,1)', //red
                        width: 3
                    })
                });
                // only one feature is selected/deselected at a time
                if (event.selected[0]){
                    event.selected[0].setStyle(selectedStyle);
                }
                if (event.deselected[0]){
                    event.deselected[0].setStyle(unselectedStyle);
                }
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
            vm.source.on('addfeature', function(event){
                // Add style to make it stand out from the AOI
                var style =  new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255,255,255,0.6)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(255,0,0,1)', //red
                        width: 1
                    })
                });
                event.feature.setStyle(style);
                 $timeout(function() {
                    $scope.$apply(vm.numberOfPriorityAreas++);
                });
            });
            vm.source.on('removefeature', function(){
                $timeout(function() {
                    $scope.$apply(vm.numberOfPriorityAreas--);
                });
            });
        }

        /**
         * Get project metadata
         * @param id
         */
        function getProjectMetadata(id){
            vm.errorReturningProjectMetadata = false;
            var resultsPromise = projectService.getProjectMetadata(id);
            resultsPromise.then(function (data) {
                vm.source.clear(); // clear the priority areas
                vm.project = data;
                getLicenses();
                // only 'non-empty' locales are included so add empty locales to ease editing
                // TODO: move to separate service?
                for (var i = 0; i < vm.locales.length; i++){
                    var found = false;
                    for (var j = 0; j < vm.project.projectInfoLocales.length; j++){
                        if (vm.locales[i] === vm.project.projectInfoLocales[j].locale){
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
                            "instructions": "",
                            "perTaskInstructions": ""
                        };
                        vm.project.projectInfoLocales.push(locale);
                    }
                }
                if (vm.project.dueDate) {
                    vm.project.dueDate = new Date(vm.project.dueDate);
                }
                populateTypesOfMapping();
                populateIdPresets();
                populateEditorsForMapping();
                populateEditorsForValidation();
                addAOIToMap();
                addPriorityAreasToMap();
                if (vm.project.organisationTag) {
                    vm.projectOrganisationTag = [vm.project.organisationTag];
                }
                if (vm.project.campaignTag) {
                    vm.projectCampaignTag = [vm.project.campaignTag];
                }
                if (vm.project.customEditor) {
                    vm.customEditor = vm.project.customEditor;
                }
            }, function(){
                vm.errorReturningProjectMetadata = true;
            });
        }

        /**
         * Get licenses
         */
        function getLicenses(){
            var resultsPromise = licenseService.getLicenseList();
            resultsPromise.then(function (data) {
                // On success
                vm.licenses = data.licenses;
                if (vm.licenses){
                    for (var i = 0; i < vm.licenses.length; i++){
                        if (vm.licenses[i].licenseId === vm.project.licenseId){
                            vm.projectLicense = vm.licenses[i];
                            break;
                        }
                    }
                }
            }, function(){
                // On error
            });
        }

        /**
         * Add the interactions for the priority areas section
         */
        function addInteractions(){

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
         * Add AOI to map (priority areas section)
         */
        function addAOIToMap(){
            // Create a vector source and layer for the AOI
            var source = new ol.source.Vector();
            var vector = new ol.layer.Vector({
                source: source
            });
            vm.map.addLayer(vector);

            // Get features from GeoJSON
            var AOIFeatures = geospatialService.getFeaturesFromGeoJSON(vm.project.areaOfInterest);

            // Add features to map
            source.addFeatures(AOIFeatures);

            // Zoom to the extent of the AOI
            vm.map.getView().fit(source.getExtent());
        }

        /**
         * Add the priority areas to the map
         */
        function addPriorityAreasToMap(){
            if (vm.project.priorityAreas) {
                for (var i = 0; i < vm.project.priorityAreas.length; i++) {
                    var feature = geospatialService.getFeatureFromGeoJSON(vm.project.priorityAreas[i]);
                    vm.source.addFeature(feature);
                }
            }
        }

        /**
         * Populate the types of mapping fields by checking which tags exist
         * in the mappingTypes array on the project
         */
        function populateTypesOfMapping(){
            if (vm.project.mappingTypes) {
                if (vm.project.mappingTypes.indexOf("ROADS") != -1) {
                    vm.mappingTypes.roads = true;
                }
                if (vm.project.mappingTypes.indexOf("BUILDINGS") != -1) {
                    vm.mappingTypes.buildings = true;
                }
                if (vm.project.mappingTypes.indexOf("WATERWAYS") != -1) {
                    vm.mappingTypes.waterways = true;
                }
                if (vm.project.mappingTypes.indexOf("LAND_USE") != -1) {
                    vm.mappingTypes.landuse = true;
                }
                if (vm.project.mappingTypes.indexOf("OTHER") != -1) {
                    vm.mappingTypes.other = true;
                }
            }
        }

        /**
         * Populate the iD preset selections from the project data
         */
        function populateIdPresets(){
            if (vm.project.idPresets && vm.project.idPresets.length > 0) {
                vm.limitPresets = true;
                vm.project.idPresets.forEach(function(preset) {
                    vm.selectedPresets[preset] = true;
                });
            }
            else {
                // If the project is still in draft status, go with the configured
                // default as it's assumed the PM will save the project multiple
                // times during configuration and we don't to give significance to
                // a lack of presets at this stage
                vm.limitPresets = vm.project.projectStatus === 'PUBLISHED' ? false :
                                  !!configService.idPresetsLimitedByDefault;
            }
        }

        /**
         * Get mapping types in array
         */
        vm.getMappingTypesArray = function(){
            var mappingTypesArray = [];
            if (vm.mappingTypes.roads){
                mappingTypesArray.push("ROADS");
            }
            if (vm.mappingTypes.buildings){
                mappingTypesArray.push("BUILDINGS");
            }
            if (vm.mappingTypes.waterways) {
                mappingTypesArray.push("WATERWAYS");
            }
            if (vm.mappingTypes.landuse){
                mappingTypesArray.push("LAND_USE");
            }
            if (vm.mappingTypes.other){
                mappingTypesArray.push("OTHER");
            }
            return mappingTypesArray;
        }

        /**
         * Populate the mapping editor fields by checking which tags exist
         * in the mappingEditors array on the project
         */
        function populateEditorsForMapping(){
            if (vm.project.mappingEditors) {
                vm.mappingEditors.id = vm.project.mappingEditors.indexOf("ID") != -1;
                vm.mappingEditors.josm = vm.project.mappingEditors.indexOf("JOSM") != -1;
                vm.mappingEditors.potlatch2 = vm.project.mappingEditors.indexOf("POTLATCH_2") != -1;
                vm.mappingEditors.fieldpapers = vm.project.mappingEditors.indexOf("FIELD_PAPERS") != -1;
                vm.mappingEditors.custom = vm.project.mappingEditors.indexOf("CUSTOM") != -1;
            }
        }

        /**
         * Get map editors in array
         */
        function getMappingEditorsArray(){
            var mappingEditorsArray = [];
            if (vm.mappingEditors.id){
                mappingEditorsArray.push("ID");
            }
            if (vm.mappingEditors.josm){
                mappingEditorsArray.push("JOSM");
            }
            if (vm.mappingEditors.potlatch2) {
                mappingEditorsArray.push("POTLATCH_2");
            }
            if (vm.mappingEditors.fieldpapers){
                mappingEditorsArray.push("FIELD_PAPERS");
            }
            if (vm.mappingEditors.custom && vm.project.customEditor && vm.project.customEditor.enabled){
                mappingEditorsArray.push("CUSTOM");
            }
            return mappingEditorsArray;
        }


        /**
         * Populate the validation editor fields by checking which tags exist
         * in the validationEditors array on the project
         */
        function populateEditorsForValidation(){
            if (vm.project.validationEditors) {
                vm.validationEditors.id = vm.project.validationEditors.indexOf("ID") != -1;
                vm.validationEditors.josm = vm.project.validationEditors.indexOf("JOSM") != -1;
                vm.validationEditors.potlatch2 = vm.project.validationEditors.indexOf("POTLATCH_2") != -1;
                vm.validationEditors.fieldpapers = vm.project.validationEditors.indexOf("FIELD_PAPERS") != -1;
                vm.validationEditors.custom = vm.project.validationEditors.indexOf("CUSTOM") != -1;
            }
        }

        /**
         * Get validate editors in array
         */
        function getValidationEditorsArray(){
            var validationEditorsArray = [];
            if (vm.validationEditors.id){
                validationEditorsArray.push("ID");
            }
            if (vm.validationEditors.josm){
                validationEditorsArray.push("JOSM");
            }
            if (vm.validationEditors.potlatch2) {
                validationEditorsArray.push("POTLATCH_2");
            }
            if (vm.validationEditors.fieldpapers){
                validationEditorsArray.push("FIELD_PAPERS");
            }
            if (vm.validationEditors.custom && vm.project.customEditor && vm.project.customEditor.enabled){
                validationEditorsArray.push("CUSTOM");
            }
            return validationEditorsArray;
        }

        /**
         * Get selected iD presets as an array. Only presets for active mapping
         * types are included, and only if presets are to be limited at all
         */
        vm.getIdPresets = function() {
            var chosenPresets = Object.keys(vm.selectedPresets).filter(function(preset) {
                return vm.selectedPresets[preset];
            });

            if (!vm.limitPresets || chosenPresets.length === 0) {
                return [];
            }

            var presets = [];
            Object.keys(vm.mappingTypes).forEach(function(mappingType) {
                if (vm.mappingTypes[mappingType]) {
                    presets = presets.concat(intersectingElements(chosenPresets,
                                                                  vm.mappingTypePresets[mappingType]));
                }
            });

            return presets;
        }

         /**
         * Set organisation tags
         */
        function setOrganisationTags() {
            var resultsPromise = tagService.getOrganisationTags();
            resultsPromise.then(function (data) {
                // On success, set the projects results
                vm.organisationTags = data.tags;
            }, function () {
                // On error
                vm.organisationTags = [];
            });
        }

        /**
         * Set campaign tags
         */
        function setCampaignTags(){
            var resultsPromise = tagService.getCampaignTags();
            resultsPromise.then(function (data) {
                // On success, set the projects results
                vm.campaignTags = data.tags;
            }, function () {
                // On error
                vm.campaignTags = [];
            });
        }

        /**
         * Clone a project by getting the project ID and name and navigating to the project create page
         */
        vm.cloneProject = function(){
            $location.path('/admin/create-project').search({
                projectId: vm.project.projectId,
                projectName: getProjectNameForDefaultLocale()
            });
        };

        /**
         * Get the default language name
         */
        function getProjectNameForDefaultLocale(){
            var projectName = '';
            var projectInfo = vm.project.projectInfoLocales;
            for (var i = 0; i < projectInfo.length; i++){
                if (projectInfo[i].locale === vm.project.defaultLocale){
                    projectName = projectInfo[i].name;
                    return projectName;
                }
            }
            return projectName;
        }

        /**
         * Return array of unique elements that appear in both arrays a and b
         */
        function intersectingElements(a, b){
            if (!a || !b || a.length === 0 || b.length === 0) {
              return [];
            }

            var intersecting = [];
            for (var i = 0; i < a.length; i++) {
                if (b.indexOf(a[i]) !== -1 && intersecting.indexOf(a[i]) === -1) {
                    intersecting.push(a[i]);
                }
            }

            return intersecting;
        }
        /*
         * Removes the custom editor from the project
         */
        vm.deleteCustomEditor = function(){
            delete vm.customEditor;
            populateEditorsForMapping();
            populateEditorsForValidation();
        }
    }
})();
