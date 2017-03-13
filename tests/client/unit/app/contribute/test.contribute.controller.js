'use strict';

describe('contribute.controller', function () {
    var contributeController = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller) {
            contributeController = $controller('contributeController');
        });
    });

    it('should be created successfully', function () {
        expect(contributeController).toBeDefined()
    });
});