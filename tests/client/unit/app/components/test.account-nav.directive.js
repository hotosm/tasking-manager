'use strict';

describe('account-nav.directive', function () {
    var accountNavController, scope = null;

    beforeEach(function () {
        module('taskingManager');


         inject(function ($controller, $rootScope) {
             scope = $rootScope.$new();
             accountNavController = $controller('accountNavController', {$scope: scope});
         });
    });

    it('should be created successfully', function () {
        expect(accountNavController).toBeDefined()
    });
});