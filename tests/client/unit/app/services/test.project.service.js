'use strict';

describe('project.service', function () {
    var projectService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_projectService_) {
            projectService = _projectService_;
        });
    });

    it('should be created successfully', function () {
        expect(projectService).toBeDefined()
    });
});

