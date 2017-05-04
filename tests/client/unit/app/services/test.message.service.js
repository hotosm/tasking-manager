'use strict';

describe('message.service', function () {
    var messageService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_messageService_) {
            messageService = _messageService_;
        });
    });

    it('should be created successfully', function () {
        expect(messageService).toBeDefined()
    });
});