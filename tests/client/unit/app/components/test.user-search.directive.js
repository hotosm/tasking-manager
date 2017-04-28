'use strict';

describe('user-search.directive', function () {
    var userSearchController = null;

    beforeEach(function () {
        module('taskingManager');


         inject(function ($controller) {
             userSearchController = $controller('userSearchController');
         });
    });

    it('should be created successfully', function () {
        expect(userSearchController).toBeDefined()
    });
});