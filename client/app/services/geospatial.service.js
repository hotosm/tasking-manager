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
            getGeoJSONObjectFromFeatures: getGeoJSONObjectFromFeatures,
            getCenterOfExtent: getCenterOfExtent,
            transformExtentToLatLonString: transformExtentToLatLonString,
            transformExtentToLatLonArray: transformExtentToLatLonArray,
            getBoundingExtentFromFeatures: getBoundingExtentFromFeatures
        };

        return service;

        /**
         * Get OL features from GeoJSON
         * @param {string} geojson
         * @returns {Array.<ol.Feature>}
         */
        function getFeaturesFromGeoJSON(geojson) {
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
        function getFeatureFromGeoJSON(geojson) {
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
        function getFeaturesFromKML(kml) {
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
        function getGeoJSONFromFeature(feature) {
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
        function getGeoJSONObjectFromFeature(feature) {
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
        function getGeoJSONFromFeatures(features) {
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
        function getGeoJSONObjectFromFeatures(features) {
            var format = new ol.format.GeoJSON();
            var geojsonObject = format.writeFeaturesObject(features, {
                dataProjection: DATA_PROJECTION,
                featureProjection: MAP_PROJECTION
            });
            return geojsonObject;
        }

        /**
         * Get center of extent
         * This only works accurately in coordinate systems such as EPSG:3857
         * @param OL extent
         * @returns {*[]}
         */
        function getCenterOfExtent(extent) {
            var x = extent[0] + (extent[2] - extent[0]) / 2;
            var y = extent[1] + (extent[3] - extent[1]) / 2;
            return [x, y];
        }

        /**
         * Transform extent from map projection to lat lon
         * @param extent
         * @returns {string}
         */
        function transformExtentToLatLonString(extent) {
            var bottomLeft = ol.proj.transform([extent[0], extent[1]], MAP_PROJECTION, DATA_PROJECTION);
            var topRight = ol.proj.transform([extent[2], extent[3]], MAP_PROJECTION, DATA_PROJECTION);
            var extentLatLon = bottomLeft[0] + ',' + bottomLeft[1] + ',' + topRight[0] + ',' + topRight[1];
            return extentLatLon;
        }

        /**
         * Transform extent from map projection to lat lon
         * @param extent
         * @returns {Array}
         */
        function transformExtentToLatLonArray(extent) {
            var bottomLeft = ol.proj.transform([extent[0], extent[1]], MAP_PROJECTION, DATA_PROJECTION);
            var topRight = ol.proj.transform([extent[2], extent[3]], MAP_PROJECTION, DATA_PROJECTION);
            var extentLatLon = [bottomLeft[0], bottomLeft[1], topRight[0], topRight[1]];
            return extentLatLon;
        }

        /**
         * Get the bounding extent of an array of ol.Feature objects
         * @param features {Array<ol.Feature>}
         * @returns {null|ol.Extent}
         */
        function getBoundingExtentFromFeatures(features) {

            //check we have an non empty array of ol.Feature objects
            if (!Array.isArray(features)) {
                return null;
            }

            if (features.length < 1) {
                return null;
            }


            for (var i = 0; i < features.length; i++) {
                if (!(features[i] instanceof ol.Feature)) {
                    return null
                }
            }

            var extent = features[0].getGeometry().getExtent();
            for (var i = 1; i < features.length; i++) {
                extent = ol.extent.extend(extent, features[i].getGeometry().getExtent());
            }
            return extent;


        }
    }
})();