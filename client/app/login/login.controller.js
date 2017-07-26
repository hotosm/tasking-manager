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
            // Force a logout first by clearing the local storage. This prevents getting stuck in a loop with an 
            // invalid/expired token. The GET user API is called if a token is there on loading the page, so also if 
            // there was an invalid/expired one. By removing the token before logging in, it doesn't have an invalid 
            // token when it returns from OpenStreetMap.
            authService.logout();
            authService.login(vm.redirectURL);
        };
        
        vm.returnToPreviousPage = function(){
            $location.path(vm.redirectURL);
        };
    }
})();