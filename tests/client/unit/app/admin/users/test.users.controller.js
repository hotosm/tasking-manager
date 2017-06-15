'use strict';

describe('users.controller', function () {
    var usersController, scope = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller, $rootScope) {
            scope = $rootScope.$new();
            usersController = $controller('usersController', {$scope: scope});
        });
    });

    it('should be created successfully', function () {
        expect(usersController).toBeDefined()
    });
});