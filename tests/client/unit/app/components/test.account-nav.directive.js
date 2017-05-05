'use strict';

describe('account-nav.directive', function () {
    var accountNavController, scope, element = null;

    beforeEach(function () {
        module('taskingManager');


         inject(function ($controller, $rootScope) {
             scope = $rootScope.$new();
             element = angular.element('<div></div>');
             accountNavController = $controller('accountNavController', {$scope: scope, $element: element});
         });
    });

    it('should be created successfully', function () {
        expect(accountNavController).toBeDefined()
    });
});