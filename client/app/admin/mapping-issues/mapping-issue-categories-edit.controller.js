(function () {

    'use strict';

    /**
     * Mapping-issue Categories controller which manages viewing, creating and
     * editing categories
     */
    angular
        .module('taskingManager')
        .controller('mappingIssueCategoriesEditController',
                    ['$routeParams', '$location', 'mappingIssueService', mappingIssueCategoriesEditController]);

    function mappingIssueCategoriesEditController($routeParams, $location, mappingIssueService) {
        var vm = this;
        
        vm.category = {};
        vm.isNew = false;
        vm.isCategoryFound = false;
        vm.isSaveEditsSuccessful = true;
        vm.isArchiveSuccessful = true;
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
                vm.id = parseInt(vm.id, 10);
                var resultsPromise = mappingIssueService.getMappingIssueCategories(true);
                resultsPromise.then(function (data) {
                    // On success
                    vm.category = data.categories.find(function(category) {
                      return category.categoryId === vm.id;
                    });

                    vm.isCategoryFound = !!vm.category;
                }, function(){
                    // On error
                    vm.isCategoryFound = false;
                });
            }
        }

        /**
         * Cancel editing the category by going to the list of categories
         */
        vm.cancel = function(){
            $location.path('/admin/mapping-issues/categories');
        };

        /**
         * Save the edits made to the category
         */
        vm.saveEdits = function(){
            vm.isSaveEditsSuccessful = true;
            var resultsPromise = mappingIssueService.updateMappingIssueCategory(vm.category, vm.id);
            resultsPromise.then(function () {
                // On success
                $location.path('/admin/mapping-issues/categories');
            }, function () {
                // On error
                vm.isSaveEditsSuccessful = false;
            });
        };

        /**
         * Archive the category
         */
        vm.archive = function(){
            vm.category.archived = true;
            vm.updateArchivedFlag()
        };

        /**
         * Unarchive the category
         */
        vm.unarchive = function(){
            vm.category.archived = false;
            vm.updateArchivedFlag()
        };

        /**
         * Perform an update of the category's archived flag
         */
        vm.updateArchivedFlag = function() {
            vm.isArchiveSuccessful = true;
            var resultsPromise = mappingIssueService.updateMappingIssueCategory(vm.category, vm.id);
            resultsPromise.then(function () {
                // On success
                $location.path('/admin/mapping-issues/categories');
            }, function () {
                // On error
                vm.isArchiveSuccessful = false;
            });
        };

        /**
         * Delete the category
         */
        vm.delete = function(){
            vm.isDeleteSuccessful = true;
            var resultsPromise = mappingIssueService.deleteMappingIssueCategory(vm.id);
            resultsPromise.then(function () {
                // On success
                $location.path('/admin/mapping-issues/categories');
            }, function () {
                // On error
                vm.isDeleteSuccessful = false;
            });
        };

        /**
         * Create a new category
         */
        vm.createNewMappingIssueCategory = function(){
            vm.isCreateNewSuccessful = true;
            var resultsPromise = mappingIssueService.createMappingIssueCategory(vm.category);
            resultsPromise.then(function () {
                // On success
                $location.path('/admin/mapping-issues/categories');
            }, function () {
                // On error
                vm.isCreateNewSuccessful = false;
            });
        };
    }
})();
