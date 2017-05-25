'use strict';

describe('license.service', function () {
    var licenseService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_licenseService_) {
            licenseService = _licenseService_;
        });
    });

    it('should be created successfully', function () {
        expect(licenseService).toBeDefined()
    });
});