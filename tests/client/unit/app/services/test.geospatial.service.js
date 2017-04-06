'use strict';

describe('geospatial.service', function () {
    var geospatialService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_geospatialService_) {
            geospatialService = _geospatialService_;
        });
    });

    it('should be created successfully', function () {
        expect(geospatialService).toBeDefined()
    });

    it('should return null when array unexpected objects is passed in', function () {

        //arrange
        var features = ['sdfsdf'];

        //act
        var returnedFeatures = geospatialService.getBoundingExtentFromFeatures(features);

        //assert
        expect(returnedFeatures).toEqual(null);
    });

    it('should return correct bounding box', function () {

        //arrange
        var polygon1 = new ol.geom.Polygon([[
            [0, 0],
            [1, 1],
            [-1, 1],
            [0, 1],
            [0, 0]
        ]]);
        var feature1 = new ol.Feature({
            geometry: polygon1
        });

        var features = [feature1];

        //act
        var boundingExtent = geospatialService.getBoundingExtentFromFeatures(features);

        //assert
        expect(boundingExtent).toEqual(feature1.getGeometry().getExtent());
    });


    it('should return correct bounding box', function () {

        //arrange
        var polygon1 = new ol.geom.Polygon([[
            [0, 0],
            [1, 1],
            [-1, 1],
            [0, 1],
            [0, 0]
        ]]);
        var feature1 = new ol.Feature({
            geometry: polygon1
        });

        var polygon2 = new ol.geom.Polygon([[
            [0, 0],
            [1, 1],
            [-1, 1],
            [0, 1],
            [0, 0]
        ]]);
        var feature2 = new ol.Feature({
            geometry: polygon2
        });

        var features = [feature1];


        //act
        var boundingExtent = geospatialService.getBoundingExtentFromFeatures(features);

        //assert
        expect(boundingExtent).toEqual(feature1.getGeometry().getExtent());
    });

it('should return correct bounding box', function () {

        //arrange
        var polygon1 = new ol.geom.Polygon([[
            [2, 0],
            [3, 0],
            [3, 1],
            [2, 1],
            [2, 0]
        ]]);
        var feature1 = new ol.Feature({
            geometry: polygon1
        });

        var polygon2 = new ol.geom.Polygon([[
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0]
        ]]);
        var feature2 = new ol.Feature({
            geometry: polygon2
        });

        var features = [feature1, feature2];

        //act
        var boundingExtent = geospatialService.getBoundingExtentFromFeatures(features);

        //assert
        expect(boundingExtent).toEqual([0,0,3,1]);
    });
});