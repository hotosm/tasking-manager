(function () {

    'use strict';

    /**
     * Create project controller which manages creating a new project
     */
    angular
        .module('taskingManager')
        .controller('createProjectController', ['$scope', '$location', 'mapService', 'drawService', 'projectService', 'geospatialService', 'accountService', 'authService','searchService','styleService','projectMapService', createProjectController]);

    function createProjectController($scope, $location, mapService, drawService, projectService, geospatialService, accountService, authService, searchService, styleService, projectMapService) {

        var vm = this;
        vm.map = null;

        // Wizard 
        vm.currentStep = '';
        vm.projectName = '';
        vm.projectNameForm = {};
        vm.taskType = 'square-grid';

        // AOI 
        vm.AOI = null;
        vm.isDrawnAOI = false;
        vm.isImportedAOI = false;
        vm.clipTasksToAoi = true;

        // Other project AOI
        vm.otherProjectVectorLayer = null;
        vm.otherProjectMaxResolution = 200;
        vm.currentResolution = 0;

        // Grid
        vm.isTaskGrid = false;
        vm.isTaskArbitrary = false;
        vm.sizeOfTasks = 0;
        vm.MAX_SIZE_OF_TASKS = 1000; //in square kilometers
        vm.numberOfTasks = 0;
        vm.MAX_NUMBER_OF_TASKS = 2000;
        vm.MAX_NUMBER_OF_TASKS_SPLIT = 1500; // by limiting the split button, the user will not likely create a project with more than the max number of tasks

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
        vm.createProjectFailReason = '';
        vm.createProjectSuccess = false;

        // Split tasks
        vm.drawAndSelectPolygon = null;
        vm.drawAndSelectPoint = null;

        // Draw interactions
        vm.modifyInteraction = null;
        vm.drawPolygonInteraction = null;

        //waiting spinner
        vm.waiting = false;
        vm.trimError = false;
        vm.trimErrorReason = '';

        activate();

        function activate() {

            // Check if the user has the PROJECT_MANAGER or ADMIN role. If not, redirect
            var session = authService.getSession();
            if (session) {
                var resultsPromise = accountService.getUser(session.username);
                resultsPromise.then(function (user) {
                    // Returned the user successfully. Check the user's role
                    if (user.role !== 'PROJECT_MANAGER' && user.role !== 'ADMIN') {
                        $location.path('/');
                    }
                }, function () {
                    // an error occurred, navigate to homepage
                    $location.path('/');
                });
            }

            vm.currentStep = 'area';

            mapService.createOSMMap('map');
            mapService.addGeocoder();
            vm.map = mapService.getOSMMap();
            drawService.initInteractions(true, false, false, false, false, true);
            vm.modifyInteraction = drawService.getModifyInteraction();
            vm.drawPolygonInteraction = drawService.getDrawPolygonInteraction();
            vm.drawPolygonInteraction.on('drawstart', function () {
                drawService.getSource().clear();
            });
            projectService.initDraw(vm.map);

            addOtherProjectsLayer();

            projectMapService.initialise(vm.map);
            projectMapService.addPopupOverlay();
        }

        /**
         * Move the wizard to appropiate step for type of tasks selected
         */
        vm.setWizardStepAfterTaskTypeSelection = function () {
            if (vm.taskType === 'square-grid') {
                vm.createTaskGrid();
                vm.setWizardStep('taskSize');
            }
            else if (vm.taskType === 'arbitrary-tasks') {
                vm.createArbitaryTasks();
                vm.setWizardStep('review');
            }

        }

        /**
         * Set the current wizard step in the process of creating a project
         * @param wizardStep the step in the wizard the user wants to go to
         */
        vm.setWizardStep = function (wizardStep) {
            if (wizardStep === 'area') {
                vm.isTaskGrid = false;
                vm.isTaskArbitrary = false;
                projectService.removeTaskGrid();
                vm.currentStep = wizardStep;
                if (vm.isDrawnAOI) {
                    vm.drawPolygonInteraction.setActive(true);
                    vm.modifyInteraction.setActive(true);
                }
            }
            else if (wizardStep === 'tasks') {
                setSplitToolsActive_(false);
                vm.zoomLevelForTaskGridCreation = mapService.getOSMMap().getView().getZoom()
                    + vm.DEFAULT_ZOOM_LEVEL_OFFSET;
                // Reset the user zoom level offset
                vm.userZoomLevelOffset = 0;
                if (vm.isDrawnAOI) {
                    var aoiValidationResult = projectService.validateAOI(drawService.getSource().getFeatures());
                    vm.isAOIValid = aoiValidationResult.valid;
                    vm.AOIValidationMessage = aoiValidationResult.message;
                    if (vm.isAOIValid) {
                        vm.map.getView().fit(drawService.getSource().getExtent());
                        // Use the current zoom level + a standard offset to determine the default task grid size for the AOI
                        vm.currentStep = wizardStep;
                        vm.drawPolygonInteraction.setActive(false);
                        vm.modifyInteraction.setActive(false);
                    }
                }
                if (vm.isImportedAOI) {
                    // TODO: validate AOI - depends on what API supports! Self-intersecting polygons?
                    vm.drawPolygonInteraction.setActive(false);
                    vm.map.getView().fit(drawService.getSource().getExtent());
                    vm.currentStep = wizardStep;
                    vm.drawPolygonInteraction.setActive(false);
                    vm.modifyInteraction.setActive(false);
                }
            }
            else if (wizardStep === 'taskSize') {
                var grid = projectService.getTaskGrid();
                if (grid) {
                    vm.currentStep = wizardStep;
                }
            }
            else if (wizardStep === 'trim') {
                vm.trimError = false;
                vm.trimErrorReason = '';
                vm.currentStep = wizardStep;
            }
            else if (wizardStep === 'review') {
                setSplitToolsActive_(false);
                vm.createProjectFailed = false;
                vm.createProjectFailReason = '';
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
        vm.showWizardStep = function (wizardStep) {
            var showStep = false;
            if (wizardStep === 'area') {
                if (vm.currentStep === 'area' || vm.currentStep === 'tasks' || vm.currentStep === 'taskSize' || vm.currentStep === 'trim' || vm.currentStep === 'review') {
                    showStep = true;
                }
            }
            else if (wizardStep === 'tasks') {
                if (vm.currentStep === 'tasks' || vm.currentStep === 'taskSize' || vm.currentStep === 'trim' || vm.currentStep === 'review') {
                    showStep = true;
                }
            }
            else if (wizardStep === 'taskSize') {
                if (vm.currentStep === 'taskSize' || vm.currentStep === 'trim' || vm.currentStep === 'review') {
                    showStep = true;
                }
            }
            else if (wizardStep === 'trim') {
                if (vm.currentStep === 'trim' || vm.currentStep === 'review') {
                    showStep = true;
                }
            }
            else if (wizardStep === 'review') {
                if (vm.currentStep === 'review') {
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
        vm.drawAOI = function () {
            vm.drawPolygonInteraction.setActive(true);
            vm.isDrawnAOI = true;
            vm.isImportedAOI = false;
        };

        /**
         * Trim the task grid to the AOI
         */
        vm.trimTaskGrid = function () {

            var taskGrid = projectService.getTaskGrid();
            vm.waiting = true;
            var trimTaskGridPromise = projectService.trimTaskGrid(vm.clipTasksToAoi);
            trimTaskGridPromise.then(function (data) {
                vm.waiting = false;
                vm.trimError = false;
                vm.trimErrorReason = '';
                projectService.removeTaskGrid();
                var tasksGeoJson = geospatialService.getFeaturesFromGeoJSON(data, 'EPSG:3857');
                projectService.setTaskGrid(tasksGeoJson);
                projectService.addTaskGridToMap();
                // Get the number of tasks in project
                vm.numberOfTasks = projectService.getNumberOfTasks();
            }, function (reason) {
                vm.waiting = false;
                vm.trimError = true;
                vm.trimErrorReason = reason.status
            })
        };

        /**
         * Create arbitary tasks
         */
        vm.createArbitaryTasks = function () {
            if (vm.isImportedAOI) {
                vm.isTaskGrid = false;
                vm.isTaskArbitrary = true;
                projectService.removeTaskGrid();
                // Get and set the AOI
                var areaOfInterest = drawService.getSource().getFeatures();
                projectService.setAOI(areaOfInterest);
                // Get the number of tasks in project
                vm.numberOfTasks = drawService.getSource().getFeatures().length;

            }
        }

        /**
         * Create a task grid
         */
        vm.createTaskGrid = function () {

            vm.isTaskGrid = true;
            vm.isTaskArbitrary = false;

            // Remove existing task grid
            projectService.removeTaskGrid();

            // Get and set the AOI
            var areaOfInterest = drawService.getSource().getFeatures();
            projectService.setAOI(areaOfInterest);

            // Create a task grid
            if (vm.isDrawnAOI || vm.isImportedAOI) {
                var aoiExtent = drawService.getSource().getExtent();
                var taskGrid = projectService.createTaskGrid(aoiExtent, vm.zoomLevelForTaskGridCreation + vm.userZoomLevelOffset);
                projectService.setTaskGrid(taskGrid);
                projectService.addTaskGridToMap();

                // Get the number of tasks in project
                vm.numberOfTasks = projectService.getNumberOfTasks();

                // Get the size of the tasks
                vm.sizeOfTasks = projectService.getTaskSize();
            }
        };

        /**
         * Change the size of the tasks in the grid by increasing or decreasing the zoom level
         * @param zoomLevelOffset
         */
        vm.changeSizeTaskGrid = function (zoomLevelOffset) {
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
            vm.drawPolygonInteraction.setActive(false);
            vm.isImportError = false;
            if (file) {
                drawService.getSource().clear();
                var fileReader = new FileReader();
                fileReader.onloadend = function (e) {
                    var data = e.target.result;
                    var uploadedFeatures = null;
                    if (file.name.substr(-4) === 'json') {
                        uploadedFeatures = geospatialService.getFeaturesFromGeoJSON(data);
                        setImportedAOI_(uploadedFeatures);
                    }
                    else if (file.name.substr(-3) === 'kml') {
                        uploadedFeatures = geospatialService.getFeaturesFromKML(data);
                        setImportedAOI_(uploadedFeatures);
                    }
                    else if (file.name.substr(-3) === 'zip') {
                        // Use the Shapefile.js library to read the zipped Shapefile (with GeoJSON as output)
                        shp(data).then(function (geojson) {
                            var uploadedFeatures = geospatialService.getFeaturesFromGeoJSON(geojson);
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
        function setImportedAOI_(features) {
            vm.isImportedAOI = true;
            vm.isDrawnAOI = false;
            projectService.setAOI(features);
            drawService.getSource().addFeatures(features);
            vm.map.getView().fit(drawService.getSource().getExtent());
        }

        /**
         *  Lets the user draw an area (polygon).
         *  After drawing it, the polygon is validated before splitting the intersecting
         *  tasks into smaller tasks
         */
        vm.drawAndSplitAreaPolygon = function () {

            setSplitToolsActive_(false);

            // Draw and select interaction - Polygon
            if (!vm.drawAndSelectPolygon) {
                var map = mapService.getOSMMap();
                vm.drawAndSelectPolygon = new ol.interaction.Draw({
                    type: "Polygon"
                });
                map.addInteraction(vm.drawAndSelectPolygon);
                // After drawing the polygon, validate it and split if valid
                vm.drawAndSelectPolygon.on('drawend', function (event) {
                    var aoiValidationResult = projectService.validateAOI([event.feature]);
                    // Start an Angular digest cycle manually to update the view
                    $scope.$apply(function () {
                        vm.isSplitPolygonValid = aoiValidationResult.valid;
                        vm.splitPolygonValidationMessage = aoiValidationResult.message;
                        if (vm.isSplitPolygonValid) {
                            projectService.splitTasks(event.feature);
                            // Get the number of tasks in project
                            vm.numberOfTasks = projectService.getNumberOfTasks();
                        }
                    });
                });
            }
            vm.drawAndSelectPolygon.setActive(true);
        };

        /**
         *  Lets the user draw point.
         *  After drawing it, the point is validated before splitting the intersecting
         *  tasks into smaller tasks
         */
        vm.drawAndSplitAreaPoint = function () {

            setSplitToolsActive_(false);

            // Draw and select interaction - Point
            if (!vm.drawAndSelectPoint) {
                var map = mapService.getOSMMap();
                vm.drawAndSelectPoint = new ol.interaction.Draw({
                    type: "Point"
                });
                map.addInteraction(vm.drawAndSelectPoint);
                // After drawing the point, split it
                vm.drawAndSelectPoint.on('drawend', function (event) {
                    // Start an Angular digest cycle manually to update the view
                    $scope.$apply(function () {
                        projectService.splitTasks(event.feature);
                        // Get the number of tasks in project
                        vm.numberOfTasks = projectService.getNumberOfTasks();
                    });
                });
            }
            vm.drawAndSelectPoint.setActive(true);
        };

        /**
         * Create a new project with a project name
         */
        vm.createProject = function () {
            vm.createProjectFail = false;
            vm.createProjectSuccess = false;
            if (vm.projectNameForm.$valid) {
                vm.waiting = true;
                var resultsPromise = projectService.createProject(vm.projectName, vm.isTaskGrid);
                resultsPromise.then(function (data) {
                    vm.waiting = false;
                    // Project created successfully
                    vm.createProjectFail = false;
                    vm.createProjectSuccess = true;
                    vm.createProjectFailReason = '';
                    // Navigate to the edit project page
                    $location.path('/admin/edit-project/' + data.projectId);
                }, function (reason) {
                    vm.waiting = false;
                    // Project not created successfully
                    vm.createProjectFail = true;
                    vm.createProjectSuccess = false;
                    vm.createProjectFailReason = reason.status
                });
            }
            else {
                vm.projectNameForm.submitted = true;
            }
        };

        /**
         * Set split tools to active/inactive
         * @param boolean
         * @param private
         */
        function setSplitToolsActive_(boolean) {
            if (vm.drawAndSelectPolygon) {
                vm.drawAndSelectPolygon.setActive(boolean);
            }
            if (vm.drawAndSelectPoint) {
                vm.drawAndSelectPoint.setActive(boolean);
            }
        }

        vm.toggleClipTasksToAoi = function () {
            vm.clipTasksToAoi = !vm.clipTasksToAoi;
        };

        /**
         * Add a layer that shows the AOIs of other projects
         */
        function addOtherProjectsLayer(){
            var vectorSource = new ol.source.Vector({
                loader: function(extent){
                    vectorSource.clear();
                    console.log(extent);
                    console.log(vm.map.getView().getResolution());
                    var params = {
                        bbox: geospatialService.transformExtentToLatLonString(extent)
                    };
                    var resultsPromise = searchService.getProjectsWithinBBOX(params);
                    resultsPromise.then(function (data) {
                        var features = geospatialService.getFeaturesFromGeoJSON(data);
                        vectorSource.addFeatures(features);
                    }, function (reason) {
                        // TODO
                    });
                },
                strategy: ol.loadingstrategy.bbox
            });
            vm.otherProjectVectorLayer = new ol.layer.Vector({
                source: vectorSource,
                style: function(feature){
                    var status = feature.getProperties().status;
                    if (status === 'DRAFT'){
                        return styleService.getStyleWithColour("blue");
                    }
                    else if (status === 'PUBLISHED'){
                        return styleService.getStyleWithColour("red");
                    }
                    else if (status === 'ARCHIVED'){
                        return styleService.getStyleWithColour("black");
                    }
                    else {
                        return styleService.getStyleWithColour("black");
                    }
                },
                maxResolution: vm.otherProjectMaxResolution
            });
            vm.map.addLayer(vm.otherProjectVectorLayer);
            vm.otherProjectVectorLayer.setVisible(false);

            // Update the resolution after moveend
            vm.map.on('moveend', function(){
                vm.currentResolution = vm.map.getView().getResolution();
                $scope.$apply();
            })
        }

        /**
         * Toggle the layer with other project AOIs
         */
        vm.toggleOtherProjectAreasLayer = function(){
            if (vm.otherProjectVectorLayer.getVisible()){
                vm.otherProjectVectorLayer.setVisible(false);
                projectMapService.closePopup();
            }
            else {
                vm.otherProjectVectorLayer.setVisible(true);
            }
        };
    }
})();