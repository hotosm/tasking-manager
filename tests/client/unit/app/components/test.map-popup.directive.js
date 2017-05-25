'use strict';

describe('mapPopup.directive', function () {

    var mapPopupController, scope = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller, $rootScope) {
            scope = $rootScope.$new();
            mapPopupController = $controller('mapPopupController', {$scope: scope});
        });
    });

    it('should be created successfully', function () {
        expect(mapPopupController).toBeDefined()
    });
});