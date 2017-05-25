'use strict';

describe('create-project.controller', function () {
    var createProjectController, scope = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller, $rootScope) {
            scope = $rootScope.$new();
            createProjectController = $controller('createProjectController', {$scope: scope});
        });
    });

    it('should be created successfully', function () {
        expect(createProjectController).toBeDefined()
    });
});