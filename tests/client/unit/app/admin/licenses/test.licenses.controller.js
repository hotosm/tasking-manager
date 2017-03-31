'use strict';

describe('licenses.controller', function () {
    var licensesController = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller) {
            licensesController = $controller('licensesController');
        });
    });

    it('should be created successfully', function () {
        expect(licensesController).toBeDefined()
    });
});