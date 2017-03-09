'use strict';

describe('style.service', function () {
    var styleService = null;

    var FILL_COLOUR_READY = 'rgba(223,223,223,0.1)';//very light gray, 0.1 opacity
    var FILL_COLOUR_INVALIDATED = 'rgba(84,84,84,0.4)';//grey, 0.4 opacity
    var FILL_COLOUR_DONE = 'rgba(255,165,0,0.4)';//orange, 0.4 opacity
    var FILL_COLOUR_VALIDATED = 'rgba(0,128,0,0.4)';//green, 0.4 opacity

    var STROKE_COLOUR_LOCKED = 'rgba(255,165,0,1)';//orange, 1.0 opacity
    var STROKE_COLOUR_UNLOCKED = 'rgba(84,84,84,0.7)';//grey, 0.7 opacity

    var STROKE_WIDTH_HEAVY = 2;
    var STROKE_WIDTH_LIGHT = 1;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_styleService_) {
            styleService = _styleService_;
        });
    });

    it('should return correct style for status = "READY" and taskLocked = False', function () {
        // arrange
        var taskFeature = new ol.Feature({
            'taskStatus': 'READY',
            'taskLocked': false
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: FILL_COLOUR_READY
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR_UNLOCKED,
              width: STROKE_WIDTH_LIGHT
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return correct style for taskStatus = "READY" and taskLocked = true', function () {
        // arrange
        var taskFeature = new ol.Feature({
            'taskStatus': 'READY',
            'taskLocked': true
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: FILL_COLOUR_READY
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR_LOCKED,
              width: STROKE_WIDTH_HEAVY
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return correct style for taskStatus = "INVALIDATED" and taskLocked = False', function () {
        // arrange
        var taskFeature = new ol.Feature({
            'taskStatus': 'INVALIDATED',
            'taskLocked': false
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: FILL_COLOUR_INVALIDATED
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR_UNLOCKED,
              width: STROKE_WIDTH_LIGHT
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return correct style for taskStatus = "INVALIDATED" and taskLocked = True', function () {
        // arrange
        var taskFeature = new ol.Feature({
            'taskStatus': 'INVALIDATED',
            'taskLocked': true
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: FILL_COLOUR_INVALIDATED
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR_LOCKED,
              width: STROKE_WIDTH_HEAVY
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return correct style for taskStatus = "DONE" and taskLocked = False', function () {
        // arrange
        var taskFeature = new ol.Feature({
            'taskStatus': 'DONE',
            'taskLocked': false
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: FILL_COLOUR_DONE
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR_UNLOCKED,
              width: STROKE_WIDTH_LIGHT
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return correct style for taskStatus = "DONE" and taskLocked = True', function () {
        // arrange
        var taskFeature = new ol.Feature({
            'taskStatus': 'DONE',
            'taskLocked': true
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: FILL_COLOUR_DONE
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR_LOCKED,
              width: STROKE_WIDTH_HEAVY
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return correct style for taskStatus = "VALIDATED" and taskLocked = False', function () {
        // arrange
        var taskFeature = new ol.Feature({
            'taskStatus': 'VALIDATED',
            'taskLocked': false
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: FILL_COLOUR_VALIDATED
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR_UNLOCKED,
              width: STROKE_WIDTH_LIGHT
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return correct style for taskStatus = "VALIDATED" and taskLocked = True', function () {
        // arrange
        var taskFeature = new ol.Feature({
            'taskStatus': 'VALIDATED',
            'taskLocked': true
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: FILL_COLOUR_VALIDATED
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR_LOCKED,
              width: STROKE_WIDTH_HEAVY
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return a style with null fill and grey outline when taskLocked is not boolean ', function () {
        // arrange
        var taskFeature = new ol.Feature({
            taskLocked: 'dfkjwlfjekj'
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: null
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR_UNLOCKED,
              width: STROKE_WIDTH_LIGHT
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return a style with null fill and grey outline when taskLocked is null ', function () {
        // arrange
        var taskFeature = new ol.Feature({
            taskLocked: null
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: null
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR_UNLOCKED,
              width: STROKE_WIDTH_LIGHT
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return a style with null fill and grey outline when taskLocked is undefined ', function () {
        // arrange
        var taskFeature = new ol.Feature({

        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: null
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR_UNLOCKED,
              width: STROKE_WIDTH_LIGHT
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return a style with null fill and grey outline when taskLocked and taskStatus are undefined', function () {
        // arrange
        var taskFeature = new ol.Feature({

        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: null
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR_UNLOCKED,
              width: STROKE_WIDTH_LIGHT
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return a style with null fill and grey outline when taskStatus is null', function () {
        // arrange
        var taskFeature = new ol.Feature({
            taskStatus: null
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: null
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR_UNLOCKED,
              width: STROKE_WIDTH_LIGHT
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

    it('should return a style with null fill and grey outline when taskStatus is unknown', function () {
        // arrange
        var taskFeature = new ol.Feature({
            taskStatus: 'ejrgfkerj'
        });

        var expectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: null
            }),
            stroke: new ol.style.Stroke({
              color: STROKE_COLOUR_UNLOCKED,
              width: STROKE_WIDTH_LIGHT
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

});
