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
});