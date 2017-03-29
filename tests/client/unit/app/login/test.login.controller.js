'use strict';

describe('login.controller', function () {
    var loginController = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller) {
            loginController = $controller('loginController');
        });
    });

    it('should be created successfully', function () {
        expect(loginController).toBeDefined()
    });
});