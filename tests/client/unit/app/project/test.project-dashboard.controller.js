'use strict';

describe('projectDashboard.controller', function () {
    var projectDashboardController = null, scope = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller, $rootScope) {
            scope = $rootScope.$new();
            projectDashboardController = $controller('projectDashboardController', {$scope: scope});
        });
    });

    it('should be created successfully', function () {
        expect(projectDashboardController).toBeDefined()
    });
});