(function () {

    'use strict';

    /**
     * Project controller which manages creating a new project
     */
    angular
        .module('taskingManager')
        .controller('projectController', ['mapService', projectController]);

    function projectController(mapService) {
        var vm = this;

        activate();

        function activate() {
            // TODO: initialise controller
            mapService.createOSMMap('map');
        }
    }
})();
