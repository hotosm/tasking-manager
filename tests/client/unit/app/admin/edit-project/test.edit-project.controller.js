'use strict';

describe('edit-project.controller', function () {
    var editProjectController, scope = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller, $rootScope) {
            scope = $rootScope.$new();
            editProjectController = $controller('editProjectController', {$scope: scope});
        });
    });

    it('should be created successfully', function () {
        expect(editProjectController).toBeDefined()
    });
});