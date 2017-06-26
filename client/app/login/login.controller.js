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
            // Force a logout first by clearing cookies. This prevents getting stuck in a loop with an invalid/expired token
            // (the GET user API is called on loading the page before it can get the new token)
            authService.logout();
            authService.login(vm.redirectURL);
        };
        
        vm.returnToPreviousPage = function(){
            $location.path(vm.redirectURL);
        };
    }
})();