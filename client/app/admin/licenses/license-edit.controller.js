(function () {

    'use strict';

    /**
     * Licenses controller which manages viewing, creating and editing licenses
     */
    angular
        .module('taskingManager')
        .controller('licenseEditController', ['$routeParams', 'licenseService', licenseEditController]);

    function licenseEditController($routeParams, licenseService) {
        var vm = this;
        
        vm.license = {};
        vm.isNew = false;
        
        activate();

        function activate() {
            var id = $routeParams.id;
            if (id === 'new'){
                vm.isNew = true;
            }
            else {
                vm.license = licenseService.getLicenseForId(id);
            }
        }

        /**
         * Cancel editing the licenses by going to the list of licenses
         */
        vm.cancel = function(){
            $location.path('/admin/licenses');
        };

        /**
         * Save the edits made to the license
         */
        vm.saveEdits = function(){
            // TODO
        };

        /**
         * Delete the license
         */
        vm.delete = function(){
            // TODO
        };

        /**
         * Create a new license
         */
        vm.createNewLicense = function(){
            // TODO
            $location.path('/admin/licenses');
        };
    }
})();
