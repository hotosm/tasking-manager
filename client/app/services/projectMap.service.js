(function () {
    'use strict';
    /**
     * @fileoverview This file provides a project map service. It visualises the projects on the map
     */

    angular
        .module('taskingManager')
        .service('projectMapService', ['styleService', projectMapService]);

    function projectMapService(styleService) {
        
        var map = null;
        var projectVectorSource = null;
        var projectHighlightVectorSource = null;
        
        var service = {
            initialise: initialise,
            showProjectsOnMap: showProjectsOnMap,
            highlightProjectOnMap: highlightProjectOnMap,
            removeHighlightOnMap: removeHighlightOnMap
        };

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
            var style = styleService.getProjectStyle();
            projectVectorSource = new ol.source.Vector();
            var vectorLayer = new ol.layer.Vector({
                source: projectVectorSource,
                style: style
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
         */
        function showProjectsOnMap(projects){

            projectVectorSource.clear();

            // iterate over the projects and add the center of the project as a point on the map
            for (var i = 0; i < projects.length; i++){
                var projectCenter = ol.proj.transform(projects[i].aoiCentroid.coordinates, 'EPSG:4326', 'EPSG:3857');
                var feature = new ol.Feature({
                    geometry: new ol.geom.Point(projectCenter)
                });
                if (projectVectorSource) {
                    projectVectorSource.addFeature(feature);
                }
            }
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
    }
})();    