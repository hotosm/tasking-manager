'use strict';

describe('projectChat.directive', function () {

    var projectChatController, scope = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function ($controller, $rootScope) {
            scope = $rootScope.$new();
            projectChatController = $controller('projectChatController', {$scope: scope});
        });
    });

    it('should be created successfully', function () {
        expect(projectChatController).toBeDefined()
    });
});