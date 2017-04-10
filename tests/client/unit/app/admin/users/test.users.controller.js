'use strict';

describe('users.controller', function () {
    var usersController = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller) {
            usersController = $controller('usersController');
        });
    });

    it('should be created successfully', function () {
        expect(usersController).toBeDefined()
    });
});