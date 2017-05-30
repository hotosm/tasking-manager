'use strict';

describe('showProjectAois.directive', function () {

    var showProjectAoisController, scope = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller, $rootScope) {
            scope = $rootScope.$new();
            showProjectAoisController = $controller('showProjectAoisController', {$scope: scope});
        });
    });

    it('should be created successfully', function () {
        expect(showProjectAoisController).toBeDefined()
    });
});