'use strict';

describe('validateEmail.controller', function () {
    var validateEmailController = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller) {
            validateEmailController = $controller('validateEmailController');
        });
    });

    it('should be created successfully', function () {
        expect(validateEmailController).toBeDefined()
    });
});