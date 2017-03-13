'use strict';

describe('project.controller', function () {
    var projectController = null, scope = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller, $rootScope) {
            scope = $rootScope.$new();
            projectController = $controller('projectController', {$scope: scope});
        });
    });

    it('should be created successfully', function () {
        expect(projectController).toBeDefined()
    });
});