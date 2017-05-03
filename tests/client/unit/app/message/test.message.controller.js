'use strict';

describe('message.controller', function () {
    var messageController = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller) {
            messageController = $controller('messageController');
        });
    });

    it('should be created successfully', function () {
        expect(messageController).toBeDefined()
    });
});