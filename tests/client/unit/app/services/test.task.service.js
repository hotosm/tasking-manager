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
        var locked = false;
        var status = 'READY';

        var features = [
            new ol.Feature({
                taskLocked: locked,
                taskStatus: status
            }),
            new ol.Feature({
                taskLocked: locked,
                taskStatus: status
            }),
            new ol.Feature({
                taskLocked: true,
                taskStatus: 'INVALIDATED'
            }),
            new ol.Feature({
                taskLocked: false,
                taskStatus: 'READY'
            }),
            new ol.Feature({
                taskLocked: true,
                taskStatus: 'READY'
            }),
            new ol.Feature({
                taskLocked: false,
                taskStatus: 'OTHER'
            }),
            new ol.Feature({
                taskLocked: true,
                taskStatus: 'OTHER'
            })
        ];

        //act
        var returnedFeature = taskService.getRandomMappableTaskFeature(features);

        //assert
        expect(returnedFeature.get('taskLocked') == locked &&
            returnedFeature.get('taskStatus') === status).toEqual(true);
    });

    it('should return one unlocked INVALIDATED feature', function () {

        //arrange
        var locked = false;
        var status = 'INVALIDATED';

        var features = [
            new ol.Feature({
                taskLocked: false,
                taskStatus: 'INVALIDATED'
            }),
            new ol.Feature({
                taskLocked: false,
                taskStatus: 'INVALIDATED'
            }),
            new ol.Feature({
                taskLocked: true,
                taskStatus: 'INVALIDATED'
            }),
            new ol.Feature({
                taskLocked: true,
                taskStatus: 'READY'
            }),
            new ol.Feature({
                taskLocked: true,
                taskStatus: 'READY'
            }),
            new ol.Feature({
                taskLocked: false,
                taskStatus: 'OTHER'
            }),
            new ol.Feature({
                taskLocked: true,
                taskStatus: 'OTHER'
            })
        ];

        //act
        var returnedFeature = taskService.getRandomMappableTaskFeature(features);

        //assert
        expect(returnedFeature.get('taskLocked') == locked &&
            returnedFeature.get('taskStatus') === status).toEqual(true);
    });

    it('should return null when no mappable tasks available', function () {

        //arrange

        var features = [
            new ol.Feature({
                taskLocked: true,
                taskStatus: 'READY'
            }),
            new ol.Feature({
                taskLocked: false,
                taskStatus: 'DONE'
            }),
            new ol.Feature({
                taskLocked: false,
                taskStatus: 'VALIDATED'
            }),
            new ol.Feature({
                taskLocked: true,
                taskStatus: 'INVALIDATED'
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
                taskLocked: locked,
                taskStatus: status
            }),
            new ol.Feature({
                taskLocked: locked,
                taskStatus: status
            }),
            new ol.Feature({
                taskLocked: true,
                taskStatus: 'INVALIDATED'
            }),
            new ol.Feature({
                taskLocked: false,
                taskStatus: 'READY'
            }),
            new ol.Feature({
                taskLocked: true,
                taskStatus: 'READY'
            }),
            new ol.Feature({
                taskLocked: false,
                taskStatus: 'OTHER'
            }),
            new ol.Feature({
                taskLocked: true,
                taskStatus: 'OTHER'
            })
        ];

        //act
        var returnedFeatures = taskService.getTasksByStatus(features, locked, status);

        //assert returnedFeatures meet the criteria
        var candidates = returnedFeatures.filter(function (item) {
            if (item.get('taskLocked') == locked && item.get('taskStatus') === status) return item;

        });
        expect(returnedFeatures.length).toEqual(candidates.length);
    });


    it('should return an empty array array of unexpected objects is passed in', function () {

        //arrange
        var locked = false;
        var status = 'READY';

        var features = ['sdfsdf'];

        //act
        var returnedFeatures = taskService.getTasksByStatus(features, locked, status);

        //assert
        expect(returnedFeatures).toEqual([]);
    });


});

