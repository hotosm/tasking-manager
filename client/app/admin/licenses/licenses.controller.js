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
            vm.licenses = licenseService.getLicenses();
        }

        /**
         * Create a new license
         */
        vm.createNewLicense = function(){
            $location.path('/admin/licenses/edit/new');
        }
    }
})();
