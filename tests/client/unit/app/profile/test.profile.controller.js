'use strict';

describe('profile.controller', function () {
    var profileController = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller) {
            profileController = $controller('profileController');
        });
    });

    it('should be created successfully', function () {
        expect(profileController).toBeDefined()
    });
});