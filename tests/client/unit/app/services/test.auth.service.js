'use strict';

describe('auth.service', function () {
    var authService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_authService_) {
            authService = _authService_;
        });
    });

    it('should be created successfully', function () {
        expect(authService).toBeDefined()
    });
});
