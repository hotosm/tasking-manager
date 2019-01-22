(function () {

    'use strict';

    /**
     * Dashboard controller which manages the application page
     */
    angular
        .module('taskingManager')
        .controller('applicationKeyController', ['applicationKeyService', applicationKeyController]);

    function applicationKeyController(applicationKeyService) {
        var vm = this;
        vm.createResult = null;
        vm.createResultError = false;
        vm.createResultErrorMessage = '';
        vm.applications = {};
        vm.applicationsError = false;
        vm.applicationsMessage = '';
        vm.deleteResult = null;
        vm.deleteResultError = false;
        vm.deleteResultErrorMessage = '';

        activate();

        function activate() {
            getApplicationKeys();
        }

        vm.resetErrors = function() {
            vm.createResultError = false;
            vm.createResultErrorMessage = '';
            vm.applicationsError = false;
            vm.applicationsMessage = '';
            vm.deleteResultError = false;
            vm.deleteResultErrorMessage = '';
        };

        /**
         * Create an application key for a user
         */
        vm.createApplicationKey = function(){
           var resultsPromise = applicationKeyService.createApplicationKey();
           resultsPromise.then(function (data) {
               vm.resetErrors();
               getApplicationKeys();
           }, function(error) {
               vm.createResultError = true;
               vm.createResultErrorMessage = error.data.Error;
           });
        }

        /**
         * Get a user's application keys
         */
        function getApplicationKeys(){
            var resultsPromise = applicationKeyService.getApplicationKeys();
            resultsPromise.then(function (data) {
                vm.applications = data.applications;
                vm.resetErrors();
            }, function(error){
                vm.applications = [];
                vm.applicationsError = true;
                vm.applicationsErrorMessage = error.data.Error
            });
        }

        /**
         * Delete a user's application key
         * @param applicationKey
         */
        function deleteApplicationKey(applicationKey){
            var resultsPromise = applicationKeyService.deleteApplicationKey(applicationKey);
            resultsPromise.then(function (data) {
                vm.deleteResult = data
                vm.resetErrors();
                getApplicationKeys();
            }, function(data){
                vm.deleteResultError = true;
                vm.deleteResultErrorMessage = error.data.Error
            });
        }

    }
})();
