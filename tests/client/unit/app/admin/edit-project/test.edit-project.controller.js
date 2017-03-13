'use strict';

describe('edit-project.controller', function () {
    var editProjectController = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller) {
            editProjectController = $controller('editProjectController');
        });
    });

    it('should be created successfully', function () {
        expect(editProjectController).toBeDefined()
    });
});