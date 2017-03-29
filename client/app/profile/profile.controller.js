(function () {

    'use strict';

    /**
     * Profile controller which manages the user's profiles
     */
    angular
        .module('taskingManager')
        .controller('profileController', ['$routeParams', profileController]);

    function profileController($routeParams) {
        var vm = this;
        vm.username = '';

        activate();

        function activate() {
            vm.username = $routeParams.id;
        }
    }
})();
