(function () {

    /**
     * Priorities controller which manages the priorities page
     */
    angular
        .module('taskingManager')
        .controller('managePrioritiesController', ['$scope', 'Upload', '$timeout', '$location', 'authService', 'priorityService', managePrioritiesController]);

    function managePrioritiesController($scope, Upload, $timeout, $location, authService, priorityService) {
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

        /**
         * Uploads priority files
         * @param files
         */
        $scope.uploadFiles = function (files) {
            $scope.files = files;
            $scope.uploadComplete = false;
            if (files && files.length) {
                Upload.upload({
                    url: '/api/v1/priority',
                    data: {
                        files: files
                    },
                    headers: authService.getAuthenticatedHeader()
                }).then(function (response) {
                    $timeout(function () {
                        $scope.result = response.data;
                        $scope.uploadComplete = true;
                        $scope.progress = 0;
                        fetchPriorities();
                    });
                }, function (response) {
                    if (response.status > 0) {
                        $scope.errorMsg = response.status + ': ' + response.data;
                    }
                }, function (evt) {
                    $scope.progress =
                        Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                });
            }
        };

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
