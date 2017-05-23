(function () {
    'use strict';
    /**
     * @fileoverview This file provides a project map service. It visualises the projects on the map
     */

    angular
        .module('taskingManager')
        .service('projectMapService', ['styleService', '$rootScope', '$compile', projectMapService]);

    function projectMapService(styleService, $rootScope, $compile) {

        var map = null;
        var projectVectorSource = null;
        var projectHighlightVectorSource = null;


        // Popup
        var popupContainer = '';
        // the scope the compiled element is linked to
        var popupScope_ = $rootScope.$new(true);

        var service = {
            initialise: initialise,
            showProjectsOnMap: showProjectsOnMap,
            showProjectOnMap: showProjectOnMap,
            removeProjectsOnMap: removeProjectsOnMap,
            highlightProjectOnMap: highlightProjectOnMap,
            removeHighlightOnMap: removeHighlightOnMap,
            showInfoOnHoverOrClick: showInfoOnHoverOrClick,
            createPopup: createPopup,
            closePopup: closePopup
        };

        /**
         * Elements that make up the popup.
         */
        var container = null;
        var content = null;
        var closer = null;
        var overlay = null;

        return service;

        /**
         * Initialises the service by adding the vector layers
         * @param mapForProjects - OL map
         */
        function initialise(mapForProjects){
            map = mapForProjects;
            addProjectsVectorLayer_();
            addHighlightsVectorLayer_();
        }
        
        /**
         * Add vector layer for the project results
         * @private
         */
        function addProjectsVectorLayer_(){
            projectVectorSource = new ol.source.Vector();
            var vectorLayer = new ol.layer.Vector({
                source: projectVectorSource
            });
            map.addLayer(vectorLayer);
        }

        /**
         * Add vector layer for the highlighted project results
         * @private
         */
        function addHighlightsVectorLayer_(){
            
            var highlightStyle = styleService.getHighlightedProjectStyle();
            projectHighlightVectorSource = new ol.source.Vector();
            var highlightLayer = new ol.layer.Vector({
                source: projectHighlightVectorSource,
                style: highlightStyle
            });
            map.addLayer(highlightLayer);
        }
        
        /**
         * Show the projects on the map
         * @param projects
         * @param type - for styling purposes, optional
         * @param dontClear - optional
         */
        function showProjectsOnMap(projects, type, dontClear){
            var typeOfProject = '';
            if (type){
                typeOfProject = type;
            }
            if (!dontClear) {
                projectVectorSource.clear();
            }

            // iterate over the projects and add the center of the project as a point on the map
            for (var i = 0; i < projects.length; i++){
                showProjectOnMap(projects[i], projects[i].aoiCentroid, typeOfProject);
            }
        }

        /**
         * Show project on map
         * @param project
         * @param aoiCentroid
         * @param type - optional
         * @param zoomTo - optional
         */
        function showProjectOnMap(project, aoiCentroid, type, zoomTo) {
            var projectCenter = ol.proj.transform(aoiCentroid.coordinates, 'EPSG:4326', 'EPSG:3857');
            var feature = new ol.Feature({
                geometry: new ol.geom.Point(projectCenter)
            });
            feature.setProperties({
                'projectId': project.projectId,
                'projectName': project.name,
                'mapperLevel': project.mapperLevel,
                'organisationTag': project.organisationTag,
                'shortDescription': project.shortDescription,
                'percentMapped': project.percentMapped,
                'percentValidated': project.percentValidated
            });
            if (projectVectorSource) {
                projectVectorSource.addFeature(feature);
                feature.setStyle(styleService.getProjectStyle(type));
            }
            if (zoomTo){
                map.getView().fit(feature.getGeometry().getExtent(), {
                    maxZoom: 8
                });
            }
        }

        /**
         * Remove projects from the map
         */
        function removeProjectsOnMap(){
            projectVectorSource.clear();
        }
        
         /**
         * Highlight project on map by showing a highlights layer
         */
        function highlightProjectOnMap(projects, id){

            // clear any existing highlighted projects from the map
            projectHighlightVectorSource.clear();
            // iterate over the projects and if the ID of the project matches the one provided
            // add the project's center as a feature to the layer on the map
            for (var i = 0; i < projects.length; i++){
                if (projects[i].id == id){
                    var projectCenter = ol.proj.transform(projects[i].aoiCentroid.coordinates, 'EPSG:4326', 'EPSG:3857');
                    var feature = new ol.Feature({
                        geometry: new ol.geom.Point(projectCenter)
                    });
                    projectHighlightVectorSource.addFeature(feature);
                }
            }
        }

        /**
         * Remove the highlight from the vector on the map
         */
        function removeHighlightOnMap(){
            projectHighlightVectorSource.clear();
        }

        /**
         * Show feature info on hover or click
         */
        function showInfoOnHoverOrClick() {

            /**
            * Elements that make up the popup.
            */
            container = document.getElementById('popup');
            content = document.getElementById('popup-content');
            closer = document.getElementById('popup-closer');
            overlay = null;

            /**
             * Create an overlay to anchor the popup to the map.
             */
            overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
                element: container,
                autoPan: true,
                autoPanAnimation: {
                    duration: 250
                }
            }));

            /**
             * Add a click handler to hide the popup.
             * @return {boolean} Don't follow the href.
             */
            if (closer){
                closer.onclick = function () {
                    overlay.setPosition(undefined);
                    closer.blur();
                    return false;
                };
            }

            map.on('pointermove', function (evt) {
                if (evt.dragging) {
                    return;
                }
                var pixel = map.getEventPixel(evt.originalEvent);
                displayFeatureInfo(pixel, evt.coordinate);
            });
            map.on('click', function (evt) {
                displayFeatureInfo(evt.pixel, evt.coordinate);
            });
            map.addOverlay(overlay);
        }

        /**
         * Creates a popup using a directive and add this popup to an overlay layer
         */
        function createPopup() {

            popupContainer = angular.element('<div map-popup id="popup" class="ol-popup"></div>');
            popupContainer.attr('selected-feature', 'feature');

            /**
             * Create an overlay to anchor the popup to the map.
             */
            overlay = new ol.Overlay({
                element: popupContainer[0],
                autoPan: true,
                autoPanAnimation: {
                    duration: 250
                }
            });
            
            map.on('pointermove', function (evt) {
                if (evt.dragging) {
                    return;
                }
                var pixel = map.getEventPixel(evt.originalEvent);
                displayFeatureInfo(pixel, evt.coordinate);
            });
            map.on('click', function (evt) {
                displayFeatureInfo(evt.pixel, evt.coordinate);
            });
            
            map.addOverlay(overlay);
        }
        
        /**
         * Close the popup and sets the OpenLayers edit interactions to true so
         * users can edit the features
         */
        function closePopup() {
            overlay.setPosition(undefined);
        };

        /**
         * Display feature info
         * @param pixel
         */
        function displayFeatureInfo(pixel, coordinate){
            var feature = map.forEachFeatureAtPixel(pixel, function(feature){
                return feature;
            });
            if (feature){
                popupScope_['feature'] = feature;

                // Compile the element, link it to the scope
                overlay.setElement(popupContainer[0]);
                $compile(popupContainer)(popupScope_);

                /*var projectId = feature.getProperties().projectId;
                var projectName = feature.getProperties().projectName;
                var mapperLevel = feature.getProperties().mapperLevel;
                var organisation = feature.getProperties().organisationTag;
                var shortDescription = feature.getProperties().shortDescription;
                content.innerHTML = '<h4>#' + projectId + ' - ' + '<a href="/project/' + projectId + '">' + projectName + '</a></h4>';
                content.innerHTML = content.innerHTML + '<p>' + mapperLevel +'</p>';
                if (organisation){
                    content.innerHTML = content.innerHTML + '<p>' + organisation + '<p>';
                }
                content.innerHTML = content.innerHTML + '<p markdown-to-html="' + shortDescription + '"><p>';*/
                overlay.setPosition(coordinate);
            }
        }
    }
})();    