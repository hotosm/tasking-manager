'use strict';

describe('account.service', function () {
    var accountService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_accountService_) {
            accountService = _accountService_;
        });
    });

    it('should be created successfully', function () {
        expect(accountService).toBeDefined()
    });
});
