(function () {

    'use strict';

    /**
     * Profile controller which manages the user's profiles
     */
    angular
        .module('taskingManager')
        .controller('profileController', ['$routeParams', 'accountService', profileController]);

    function profileController($routeParams, accountService) {
        var vm = this;
        vm.username = '';
        vm.currentlyLoggedInUser = null;
        vm.userDetails = null;

        activate();

        function activate() {
            vm.username = $routeParams.id;
            
            // Get account details from account service
             var resultsPromise = accountService.getUser(vm.username);
            resultsPromise.then(function (data) {
                // On success, set the account details for this user
                vm.userDetails = data;
                // Get the account for the currently logged in user
                var account = accountService.getAccount();
                if (account){
                    vm.currentlyLoggedInUser = account;
                }
            });
        }
    }
})();
