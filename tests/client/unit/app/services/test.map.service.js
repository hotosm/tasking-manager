'use strict';

describe('map.service', function () {
    var mapService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_mapService_) {
            mapService = _mapService_;
        });
    });

    it('should be created successfully', function () {
        expect(mapService).toBeDefined()
    });
});
