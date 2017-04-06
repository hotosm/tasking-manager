'use strict';

describe('search.service', function () {
    var searchService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_searchService_) {
            searchService = _searchService_;
        });
    });

    it('should be created successfully', function () {
        expect(searchService).toBeDefined()
    });
});