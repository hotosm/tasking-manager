'use strict';

describe('settings.service', function () {
    var settingsService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_settingsService_) {
            settingsService = _settingsService_;
        });
    });

    it('should be created successfully', function () {
        expect(settingsService).toBeDefined()
    });
});