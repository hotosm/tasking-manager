(function () {

    'use strict';

    /**
     * Mapping-issue Categories controller which manages viewing, creating and
     * editing categories of mapping issues that can be flagged during validation.
     */
    angular
        .module('taskingManager')
        .controller('mappingIssueCategoriesController',
                    ['$location', 'mappingIssueService', mappingIssueCategoriesController]);

    function mappingIssueCategoriesController($location, mappingIssueService) {
        var vm = this;
        
        vm.includeArchived = false;
        vm.issueCategories = [];
        
        loadCategories();

        function loadCategories() {
            var resultsPromise = mappingIssueService.getMappingIssueCategories(vm.includeArchived);
            resultsPromise.then(function (data) {
                // On success
                vm.issueCategories = data.categories;
            }, function(){
                // On error
            });
        }

        /**
         * Toggle whether to fetch categories that have been archived when fetching
         * the issue categories
         */
        vm.toggleIncudeArchived = function(){
          vm.includeArchived = !vm.includeArchived;
          loadCategories();
        };

        /**
         * Create a new license
         */
        vm.createNewMappingIssueCategory = function(){
            $location.path('/admin/mapping-issues/categories/edit/new');
        }
    }
})();
