'use strict';

describe('licenseEdit.controller', function () {
    var licenseEditController = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller) {
            licenseEditController = $controller('licenseEditController');
        });
    });

    it('should be created successfully', function () {
        expect(licenseEditController).toBeDefined()
    });
});