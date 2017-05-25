'use strict';

describe('inbox.controller', function () {
    var inboxController = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller) {
            inboxController = $controller('inboxController');
        });
    });

    it('should be created successfully', function () {
        expect(inboxController).toBeDefined()
    });
});