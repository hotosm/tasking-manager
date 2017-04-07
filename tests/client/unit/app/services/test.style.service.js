'use strict';

describe('style.service', function () {
    var styleService = null;

    var DEFAULT_STYLE = new ol.style.Style({
        fill: new ol.style.Fill({
          color: [250,250,250,1]
        }),
        stroke: new ol.style.Stroke({
          color: [220,220,220,1],
          width: 1
        })
    });

       var FILL_COLOUR_READY = [223,223,223,0.1];//very light grey, 0.1 opacity
        var FILL_COLOUR_INVALIDATED = [255,0,0,0.4];//red, 0.4 opacity
        var FILL_COLOUR_DONE = [255,165,0,0.4];//orange, 0.4 opacity
        var FILL_COLOUR_VALIDATED = [0,128,0,0.4];//green, 0.4 opacity
        var FILL_COLOUR_LOCKED = [30,144,255,0.4];//blue, 0.4 opacity
        var FILL_COLOUR_BADIMAGERY = [0,0,0,0.4];//black, 0.4 opacity

        var STROKE_COLOUR = [84,84,84,0.7];//grey, 0.7 opacity
        var STROKE_WIDTH = 1;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_styleService_) {
            styleService = _styleService_;
        });
    });

    it('should return correct style for status LOCKED_FOR_MAPPING', function () {
        // arrange
        var taskFeature = new ol.Feature({
            'taskStatus': 'LOCKED_FOR_MAPPING'
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: FILL_COLOUR_LOCKED
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR,
              width: STROKE_WIDTH
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return correct style for taskStatus = "READY"', function () {
        // arrange
        var taskFeature = new ol.Feature({
            'taskStatus': 'READY'
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: FILL_COLOUR_READY
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR,
              width: STROKE_WIDTH
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return correct style for taskStatus = "INVALIDATED"', function () {
        // arrange
        var taskFeature = new ol.Feature({
            'taskStatus': 'INVALIDATED'
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: FILL_COLOUR_INVALIDATED
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR,
              width: STROKE_WIDTH
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return correct style for taskStatus = "MAPPED"', function () {
        // arrange
        var taskFeature = new ol.Feature({
            'taskStatus': 'MAPPED'
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: FILL_COLOUR_DONE
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR,
              width: STROKE_WIDTH
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return correct style for taskStatus = "VALIDATED"', function () {
        // arrange
        var taskFeature = new ol.Feature({
            'taskStatus': 'VALIDATED',
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: FILL_COLOUR_VALIDATED
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR,
              width: STROKE_WIDTH
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return correct style for taskStatus = "BADIMAGERY"', function () {
        // arrange
        var taskFeature = new ol.Feature({
            'taskStatus': 'BADIMAGERY'
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: FILL_COLOUR_BADIMAGERY
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR,
              width: STROKE_WIDTH
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return default style taskStatus is null', function () {
        // arrange
        var taskFeature = new ol.Feature({
            taskStatus: null
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(DEFAULT_STYLE);
    });

    it('should return default style when taskStatus is unknown', function () {
        // arrange
        var taskFeature = new ol.Feature({
            taskStatus: 'ejrgfkerj'
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(DEFAULT_STYLE);
    });

});
