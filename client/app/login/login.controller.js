(function () {

    'use strict';

    /**
     * Login controller which manages logging in to a project
     */
    angular
        .module('taskingManager')
        .controller('loginController', ['$location','authService', loginController]);

    function loginController($location, authService) {
        var vm = this;
        vm.redirectURL = '';

        activate();

        function activate(){
            vm.redirectURL = $location.search().redirect_to;
        }

        /**
         * Login
         */
        vm.login = function(){
            authService.login(vm.redirectURL);
        };

        vm.returnToPreviousPage = function(){
            $location.path(vm.redirectURL);
        };
    }
})();
