(function () {

    'use strict';

    /**
     * Edit project controller which manages editing an existing project
     */
    angular
        .module('taskingManager')
        .controller('editProjectController', ['$location', editProjectController]);

    function editProjectController($location) {
        var vm = this;
        vm.projectName = '';
        
        activate();

        function activate() {
            vm.projectName = $location.search().projectname;
        }
    }
})();
