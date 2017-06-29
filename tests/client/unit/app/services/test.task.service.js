'use strict';

describe('task.service', function () {
    var taskService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_taskService_) {
            taskService = _taskService_;
        });
    });

    it('should be created successfully', function () {
        expect(taskService).toBeDefined();
    });

    it('should return null when empty array is passed in', function () {

        //arrange
        var features = [];

        //act
        var feature = taskService.getRandomMappableTaskFeature(features);

        //assert
        expect(feature).toEqual(null);

    });

    it('should return null when null is passed in', function () {

        //arrange
        var features = null;

        //act
        var feature = taskService.getRandomMappableTaskFeature(features);

        //assert
        expect(feature).toEqual(null);

    });

    it('should return null when passed in array members do not have a get function', function () {

        //arrange
        var features = [{make: 'ford', model: 'T'}];

        //act
        var feature = taskService.getRandomMappableTaskFeature(features);

        //assert
        expect(feature).toEqual(null);
    });

    it('should return null when passed object is not an array', function () {

        //arrange
        var features = 'dgsdg';

        //act
        var feature = taskService.getRandomMappableTaskFeature(features);

        //assert
        expect(feature).toEqual(null);
    });

    it('should return one unlocked READY feature', function () {

        //arrange
        var status = 'READY';

        var features = [
            new ol.Feature({
                taskStatus: status
            }),
            new ol.Feature({
                taskStatus: status
            }),
            new ol.Feature({
                taskStatus: 'INVALIDATED'
            }),
            new ol.Feature({
                taskStatus: 'READY'
            }),
            new ol.Feature({
                taskStatus: 'READY'
            }),
            new ol.Feature({
                taskStatus: 'OTHER'
            }),
            new ol.Feature({
                taskStatus: 'OTHER'
            })
        ];

        //act
        var returnedFeature = taskService.getRandomMappableTaskFeature(features);

        //assert
        expect(returnedFeature.get('taskStatus') === status).toEqual(true);
    });

    it('should return one READY feature', function () {

        //arrange
        var status = 'READY';

        var features = [
            new ol.Feature({
                taskStatus: 'INVALIDATED'
            }),
            new ol.Feature({
                taskStatus: 'INVALIDATED'
            }),
            new ol.Feature({
                taskStatus: 'INVALIDATED'
            }),
            new ol.Feature({
                taskStatus: 'READY'
            }),
            new ol.Feature({
                taskStatus: 'READY'
            }),
            new ol.Feature({
                taskStatus: 'OTHER'
            }),
            new ol.Feature({
                taskStatus: 'OTHER'
            })
        ];

        //act
        var returnedFeature = taskService.getRandomMappableTaskFeature(features);

        //assert
        expect(returnedFeature.get('taskStatus') === status).toEqual(true);
    });

    it('should return null when no mappable tasks available', function () {

        //arrange

        var features = [
            new ol.Feature({
                taskStatus: 'MAPPED'
            }),
            new ol.Feature({
                taskStatus: 'VALIDATED'
            }),
            new ol.Feature({
                taskStatus: 'IVALIDATED'
            })
        ];

        //act
        var feature = taskService.getRandomMappableTaskFeature(features);

        //assert
        expect(feature).toEqual(null);
    });

    it('should return an array of locked ready features', function () {

        //arrange
        var locked = false;
        var status = 'READY';

        var features = [
            new ol.Feature({
                taskStatus: status
            }),
            new ol.Feature({
                taskStatus: status
            }),
            new ol.Feature({
                taskStatus: 'INVALIDATED'
            }),
            new ol.Feature({
                taskStatus: 'READY'
            }),
            new ol.Feature({
                taskStatus: 'READY'
            }),
            new ol.Feature({
                taskStatus: 'OTHER'
            }),
            new ol.Feature({
                taskStatus: 'OTHER'
            })
        ];

        //act
        var returnedFeatures = taskService.getTasksByStatus(features, locked, status);

        //assert returnedFeatures meet the criteria
        var candidates = returnedFeatures.filter(function (item) {
            if (item.get('taskStatus') === status) return item;

        });
        expect(returnedFeatures.length).toEqual(candidates.length);
    });


    it('should return an empty array array of unexpected objects is passed in', function () {

        //arrange
        var status = 'READY';

        var features = ['sdfsdf'];

        //act
        var returnedFeatures = taskService.getTasksByStatus(features, status);

        //assert
        expect(returnedFeatures).toEqual([]);
    });

    it('should return an array of locked for mapping features', function () {

        //arrange
        var ids = [99, 100, 101];
        var status = 'LOCKED_FOR_MAPPING';

        var features = [
            new ol.Feature({
                taskId: 99,
                taskStatus: 'LOCKED_FOR_MAPPING'
            }),
            new ol.Feature({
                taskId: 100,
                taskStatus: 'LOCKED_FOR_VALIDATION'
            }),
            new ol.Feature({
                taskId: 101,
                taskStatus: 'LOCKED_FOR_VALIDATION'
            }),
            new ol.Feature({
                taskId: 102,
                taskStatus: 'READY'
            })
        ];


        //act
        var returnedFeatures = taskService.getTaskFeaturesByIdAndStatus(features, ids, status);

        //assert returnedFeatures meet the criteria
        var candidates = returnedFeatures.filter(function (item) {
            if (item.get('taskStatus') === status) return item;

        });
        expect(returnedFeatures.length).toEqual(candidates.length);
    });

    it('should return an array of locked for validation features', function () {

        //arrange
        var ids = [99, 100, 101];
        var status = 'LOCKED_FOR_VALIDATION';

        var features = [
            new ol.Feature({
                taskId: 99,
                taskStatus: 'LOCKED_FOR_MAPPING'
            }),
            new ol.Feature({
                taskId: 100,
                taskStatus: 'LOCKED_FOR_VALIDATION'
            }),
            new ol.Feature({
                taskId: 101,
                taskStatus: 'LOCKED_FOR_VALIDATION'
            }),
            new ol.Feature({
                taskId: 102,
                taskStatus: 'READY'
            })
        ];


        //act
        var returnedFeatures = taskService.getTaskFeaturesByIdAndStatus(features, ids, status);

        //assert returnedFeatures meet the criteria
        var candidates = returnedFeatures.filter(function (item) {
            if (item.get('taskStatus') === status) return item;

        });
        expect(returnedFeatures.length).toEqual(candidates.length);
    });


});

