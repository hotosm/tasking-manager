'use strict';

describe('add-layer.directive', function () {
    var addLayerController, mapService = null;

    beforeEach(function () {
        module('taskingManager');


         inject(function ($controller, _mapService_) {
            _mapService_.createOSMMap();
             mapService = _mapService_;
             addLayerController = $controller('addLayerController', {mapService: _mapService_});
         });
    });

    it('should be created successfully', function () {
        expect(addLayerController).toBeDefined()
    });
});