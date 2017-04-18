'use strict';

describe('tag.service', function () {
    var tagService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_tagService_) {
            tagService = _tagService_;
        });
    });

    it('should be created successfully', function () {
        expect(tagService).toBeDefined()
    });
});