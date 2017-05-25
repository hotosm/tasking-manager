(function () {

    'use strict';

    /**
     * Auth controller which manages validating an email
     */
    angular
        .module('taskingManager')
        .controller('validateEmailController', ['$location', validateEmailController]);

    function validateEmailController($location) {
        var vm = this;
        vm.isValidEmail = false;

        activate();

        function activate() {
            // Get the URL parameter
            var isValid = $location.search().is_valid.toLowerCase();
            if (isValid == 'true'){
                vm.isValidEmail = true;
            }
            else {
                vm.isValidEmail = false;
            }
            // Clear the URL parameters
            $location.search('is_valid', null);
        }
    }
})();