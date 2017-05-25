(function () {

    'use strict';

    /**
     * Licenses controller which manages viewing, creating and editing licenses
     */
    angular
        .module('taskingManager')
        .controller('licensesController', ['$location', 'licenseService', licensesController]);

    function licensesController($location, licenseService) {
        var vm = this;
        
        vm.licenses = [];
        
        activate();

        function activate() {
            var resultsPromise = licenseService.getLicenseList();
            resultsPromise.then(function (data) {
                // On success
                vm.licenses = data.licenses;
            }, function(){
                // On error
            });
        }

        /**
         * Create a new license
         */
        vm.createNewLicense = function(){
            $location.path('/admin/licenses/edit/new');
        }
    }
})();
