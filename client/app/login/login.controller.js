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
            var redirectURL = $location.search().redirect;
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
    }
})();