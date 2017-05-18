'use strict';

describe('language-switch.directive', function () {
    var languageSwitchController, scope, element = null;

    beforeEach(function () {
        module('taskingManager');

         inject(function ($controller, $rootScope) {
             scope = $rootScope.$new();
             element = angular.element('<div></div>');
             languageSwitchController = $controller('languageSwitchController', {$scope: scope, $element: element});
         });
    });

    it('should be created successfully', function () {
        expect(languageSwitchController).toBeDefined()
    });
});