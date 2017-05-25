'use strict';

describe('draw.service', function () {
    var drawService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_drawService_) {
            drawService = _drawService_;
        });
    });

    it('should be created successfully', function () {
        expect(drawService).toBeDefined()
    });
});
