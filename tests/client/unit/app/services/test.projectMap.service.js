'use strict';

describe('projectMap.service', function () {
    var projectMapService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_projectMapService_) {
            projectMapService = _projectMapService_;
        });
    });

    it('should be created successfully', function () {
        expect(projectMapService).toBeDefined()
    });
});
