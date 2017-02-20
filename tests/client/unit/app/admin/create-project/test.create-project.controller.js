'use strict';

describe('create-project.controller', function () {
    var createProjectController = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller) {
            createProjectController = $controller('createProjectController');
        });
    });

    it('should be created successfully', function () {
        expect(createProjectController).toBeDefined()
    });
});