(function () {

    'use strict';

    /**
     * Edit project controller which manages editing an existing project
     */
    angular
        .module('taskingManager')
        .controller('editProjectController', ['$location','mapService', editProjectController]);

    function editProjectController($location, mapService) {
        var vm = this;
        vm.currentSection = '';

        // TODO: put in object
        vm.projectStatus = 'draft';
        vm.projectPriority = 'medium';
        vm.projectName = '';
        vm.shortDescription = '';
        vm.description = '';
        vm.instructions = '';
        vm.taskInstructions = '';
        
        activate();

        function activate() {
            vm.currentSection = 'description';
            vm.projectName = $location.search().projectname;
            mapService.createOSMMap('map');
        }

        /**
         * Cancel edits
         */
        vm.cancelEdits = function(){
            //TODO: cancel edits
        };

        /**
         * Save edits
         */
        vm.saveEdits = function(){
            // TODO: save edits by calling API
        };
    }
})();
