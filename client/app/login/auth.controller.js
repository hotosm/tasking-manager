(function () {

    'use strict';

    /**
     * Auth controller which manages logging in to a project
     */
    angular
        .module('taskingManager')
        .controller('authController', ['$location','authService', authController]);

    function authController($location, authService) {
        var vm = this;
        vm.userName = '';
        vm.sessionToken = '';
        
        activate();

        function activate() {
            // Get the URL parameters
            vm.userName = $location.search().username;
            vm.sessionToken = $location.search().session_token;
            // Set the session in the authentication service
            authService.setSession(vm.sessionToken, vm.userName);
            // Return to the URL where the user came from
            var redirectURL = $location.search().redirect_to;
            if (redirectURL){
                $location.path(redirectURL);
            }
            else {
                // If no redirect URL is given, navigate to the homepage
                $location.path('/');
            }
            // Clear the URL parameters
            $location.search('username', null);
            $location.search('session_token', null);
            $location.search('redirect_to', null);
            $location.search('ng', null);
        }

        /**
         * Login
         */
        vm.login = function(){
            authService.login();
        };
        
        vm.returnToPreviousPage = function(){
            // TODO
        };
    }
})();