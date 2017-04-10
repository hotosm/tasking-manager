'use strict';

describe('dashboard.controller', function () {
    var dashboardController, scope = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller, $rootScope) {
            scope = $rootScope.$new();
            dashboardController = $controller('dashboardController', {$scope: scope});
        });
    });

    it('should be created successfully', function () {
        expect(dashboardController).toBeDefined()
    });
});