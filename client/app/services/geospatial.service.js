(function () {
    'use strict';
    /**
     * @fileoverview This file provides a geospatial helper service using OpenLayers
     */

    angular
        .module('taskingManager')
        .service('geospatialService', [geospatialService]);

    function geospatialService() {
        
        // Target projection for Turf.js / TM API
        var DATA_PROJECTION = 'EPSG:4326';

        // Map projection in OpenLayers
        var MAP_PROJECTION = 'EPSG:3857';

        var service = {
            getFeaturesFromGeoJSON: getFeaturesFromGeoJSON,
            getFeatureFromGeoJSON: getFeatureFromGeoJSON,
            getFeaturesFromKML: getFeaturesFromKML,
            getGeoJSONFromFeature: getGeoJSONFromFeature,
            getGeoJSONObjectFromFeature: getGeoJSONObjectFromFeature,
            getGeoJSONFromFeatures: getGeoJSONFromFeatures,
            getGeoJSONObjectFromFeatures: getGeoJSONObjectFromFeatures
        };

        return service;

        /**
         * Get OL features from GeoJSON
         * @param {string} geojson
         * @returns {Array.<ol.Feature>}
         */
        function getFeaturesFromGeoJSON(geojson){
            var format = new ol.format.GeoJSON();
            var features = format.readFeatures(geojson, {
                dataProjection: DATA_PROJECTION,
                featureProjection: MAP_PROJECTION
            });
            return features;
        }

        /**
         * Get OL feature from GeoJSON
         * @param {string} geojson
         * @returns <ol.Feature>
         */
        function getFeatureFromGeoJSON(geojson){
            var format = new ol.format.GeoJSON();
            var feature = format.readFeature(geojson, {
                dataProjection: DATA_PROJECTION,
                featureProjection: MAP_PROJECTION
            });
            return feature;
        }

        /**
         * Get OL features from GeoJSON
         * @param {string} kml
         * @returns {Array.<ol.Feature>}
         */
        function getFeaturesFromKML(kml){
            var format = new ol.format.KML({
                extractStyles: false,
                showPointNames: false
            });
            var features = format.readFeatures(kml, {
                dataProjection: DATA_PROJECTION,
                featureProjection: MAP_PROJECTION
            });
            return features;
        }

        /**
         * Get GeoJSON string from an OL Feature
         * @param ol.Feature
         * @returns {string} geojson
         */
        function getGeoJSONFromFeature(feature){
            var format = new ol.format.GeoJSON();
            var geojson = format.writeFeature(feature, {
                dataProjection: DATA_PROJECTION,
                featureProjection: MAP_PROJECTION
            });
            return geojson;
        }

        /**
         * Get GeoJSON object from an OL Feature
         * @param ol.Feature
         * @returns {object} geojson
         */
        function getGeoJSONObjectFromFeature(feature){
            var format = new ol.format.GeoJSON();
            var geojsonObject = format.writeFeatureObject(feature, {
                dataProjection: DATA_PROJECTION,
                featureProjection: MAP_PROJECTION
            });
            return geojsonObject;
        }

        /**
         * Get GeoJSON string from OL Features
         * @param features
         * @returns {string} geojson
         */
        function getGeoJSONFromFeatures(features){
            var format = new ol.format.GeoJSON();
            var geojson = format.writeFeatures(features, {
                dataProjection: DATA_PROJECTION,
                featureProjection: MAP_PROJECTION
            });
            return geojson;
        }

        /**
         * Get GeoJSON object from OL Features
         * @param features
         * @returns {object} geojson
         */
        function getGeoJSONObjectFromFeatures(features){
            var format = new ol.format.GeoJSON();
            var geojsonObject = format.writeFeaturesObject(features, {
                dataProjection: DATA_PROJECTION,
                featureProjection: MAP_PROJECTION
            });
            return geojsonObject;
        }
    }
})();