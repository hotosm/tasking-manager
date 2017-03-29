'use strict';

describe('editor.service', function () {
    var editorService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_editorService_) {
            editorService = _editorService_;
        });
    });

    it('should be created successfully', function () {
        expect(editorService).toBeDefined()
    });
});