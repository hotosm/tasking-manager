'use strict';

describe('language.service', function () {
    var languageService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_languageService_) {
            languageService = _languageService_;
        });
    });

    it('should be created successfully', function () {
        expect(languageService).toBeDefined()
    });
});