'use strict';

describe('about.controller', function () {
    var aboutController = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller) {
            aboutController = $controller('aboutController');
        });
    });

    it('should be created successfully', function () {
        expect(aboutController).toBeDefined()
    });
});