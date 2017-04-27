(function () {

    'use strict';

    /**
     * Licenses controller which manages viewing, creating and editing licenses
     */
    angular
        .module('taskingManager')
        .controller('licenseEditController', ['$routeParams', '$location', 'licenseService', licenseEditController]);

    function licenseEditController($routeParams, $location, licenseService) {
        var vm = this;
        
        vm.license = {};
        vm.isNew = false;
        vm.isLicenseFound = false;
        vm.isSaveEditsSuccessful = true;
        vm.isDeleteSuccessful = true;
        vm.isCreateNewSuccessful = true;
        vm.id = 0;
        
        activate();

        function activate() {
            vm.id = $routeParams.id;
            if (vm.id === 'new'){
                vm.isNew = true;
            }
            else {
                var resultsPromise = licenseService.getLicense(vm.id);
                resultsPromise.then(function (data) {
                    // On success
                    vm.license = data.license;
                    vm.isLicenseFound = true;
                }, function(){
                    // On error
                    vm.isLicenseFound = false;
                });
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
            vm.isSaveEditsSuccessful = true;
            var resultsPromise = licenseService.updateLicense(vm.license, vm.id);
            resultsPromise.then(function () {
                // On success
                $location.path('/admin/licenses');
            }, function () {
                // On error
                vm.isSaveEditsSuccessful = false;
            });
        };

        /**
         * Delete the license
         */
        vm.delete = function(){
            vm.isDeleteSuccessful = true;
            var resultsPromise = licenseService.deleteLicense(vm.id);
            resultsPromise.then(function () {
                // On success
                $location.path('/admin/licenses');
            }, function () {
                // On error
                vm.isDeleteSuccessful = false;
            });
        };

        /**
         * Create a new license
         */
        vm.createNewLicense = function(){
            vm.isCreateNewSuccessful = true;
            var resultsPromise = licenseService.createLicense(vm.license);
            resultsPromise.then(function () {
                // On success
                $location.path('/admin/licenses');
            }, function () {
                // On error
                vm.isCreateNewSuccessful = false;
            });
        };
    }
})();
