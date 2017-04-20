'use strict';

describe('stats.service', function () {
    var statsService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_statsService_) {
            statsService = _statsService_;
        });
    });

    it('should be created successfully', function () {
        expect(statsService).toBeDefined()
    });
});