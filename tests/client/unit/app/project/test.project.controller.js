'use strict';

describe('project.controller', function () {
    var projectController = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller) {
            projectController = $controller('projectController');
        });
    });

    it('should be created successfully', function () {
        expect(projectController).toBeDefined()
    });
});