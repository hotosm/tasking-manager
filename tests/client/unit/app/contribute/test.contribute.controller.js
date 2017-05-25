'use strict';

describe('contribute.controller', function () {
    var contributeController, scope = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller, $rootScope) {
            scope = $rootScope.$new();
            contributeController = $controller('contributeController', {$scope: scope});
        });
    });

    it('should be created successfully', function () {
        expect(contributeController).toBeDefined()
    });
});