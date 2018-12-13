(function () {

    /**
     * Priorities controller which manages the priorities page
     */
    angular
        .module('taskingManager')
        .controller('managePrioritiesController', ['$scope', '$timeout', '$location', 'authService', 'priorityService', managePrioritiesController]);

    function managePrioritiesController($scope, $timeout, $location, authService, priorityService) {
        var vm = this;

        vm.priorities = [];

        activate();

        function activate() {
            fetchPriorities();
        }

        function fetchPriorities() {
            var resultsPromise = priorityService.getPriorityList();
            resultsPromise.then(function (data) {
                // On success
                vm.priorities = data.priorities;
            }, function(){
                // On error
            });
        }

        vm.delete = function(priorityId) {
            var resultsPromise = priorityService.deletePriority(priorityId);
            resultsPromise.then(function () {
                // On success
                vm.priorities = vm.priorities.filter(function(priority) {
                    return priority.priorityId !== priorityId;
                });
            }, function () {
                // On error
            });
        };

        /**
         * Sorts the table by property name
         * @param propertyName
         */
        vm.sortBy = function(propertyName){
            vm.reverse = (vm.propertyName === propertyName) ? !vm.reverse : false;
            vm.propertyName = propertyName;
        };
    }
})();
