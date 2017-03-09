'use strict';

describe('style.service', function () {
    var styleService = null;

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
                color: 'rgba(223,223,223,0.1)'
            }),
            stroke: new ol.style.Stroke({
              color: 'rgba(84,84,84,0.7)',
              width: 1
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
                color: 'rgba(223,223,223,0.1)'
            }),
            stroke: new ol.style.Stroke({
              color: 'rgba(255,165,0,1)',
              width: 2
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
                color: 'rgba(84,84,84,0.4)'
            }),
            stroke: new ol.style.Stroke({
              color: 'rgba(84,84,84,0.7)',
              width: 1
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
                color: 'rgba(84,84,84,0.4)'
            }),
            stroke: new ol.style.Stroke({
              color: 'rgba(255,165,0,1)',
              width: 2
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
                color: 'rgba(255,165,0,0.4)'
            }),
            stroke: new ol.style.Stroke({
              color: 'rgba(84,84,84,0.7)',
              width: 1
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
                color: 'rgba(255,165,0,0.4)'
            }),
            stroke: new ol.style.Stroke({
              color: 'rgba(255,165,0,1)',
              width: 2
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
                color: 'rgba(0,128,0,0.4)'
            }),
            stroke: new ol.style.Stroke({
              color: 'rgba(84,84,84,0.7)',
              width: 1
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
                color: 'rgba(0,128,0,0.4)'
            }),
            stroke: new ol.style.Stroke({
              color: 'rgba(255,165,0,1)',
              width: 2
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
              color: 'rgba(84,84,84,0.7)',
              width: 1
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
              color: 'rgba(84,84,84,0.7)',
              width: 1
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
              color: 'rgba(84,84,84,0.7)',
              width: 1
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
              color: 'rgba(84,84,84,0.7)',
              width: 1
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
              color: 'rgba(84,84,84,0.7)',
              width: 1
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
              color: 'rgba(84,84,84,0.7)',
              width: 1
            })
        });

        // act
        var style = styleService.getTaskStyleFunction(taskFeature)

        // assert
        expect(style).toEqual(expectedStyle);
    });

});
