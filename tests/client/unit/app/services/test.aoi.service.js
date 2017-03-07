'use strict';

describe('aoi.service', function () {
    var aoiService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_aoiService_) {
            aoiService = _aoiService_;
        });
    });

    it('should be created successfully', function () {
        expect(aoiService).toBeDefined()
    });
});
