'use strict';

describe('user.service', function () {
    var userService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_userService_) {
            userService = _userService_;
        });
    });

    it('should be created successfully', function () {
        expect(userService).toBeDefined()
    });
});