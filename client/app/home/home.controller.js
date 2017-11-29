(function () {

    'use strict';

    /**
     * Home controller which manages the home page
     */
    angular
        .module('taskingManager')
        .controller('homeController', ['statsService', homeController]);

    function homeController(statsService) {
        var vm = this;
        vm.mappersOnline = 0;
        vm.tasksMapped = 0;
        vm.totalMappers = 0;

        activate();

        function activate() {
            console.log('iain');
            getHomePageStats();
        }


        function getHomePageStats() {
            var resultsPromise = statsService.getHomePageStats();
            resultsPromise.then(function (data) {
                vm.stats = data;
                console.log(vm.stats);
                vm.mappersOnline = data.mappersOnline;
                vm.tasksMapped = data.tasksMapped;
                vm.totalMappers = data.totalMappers;
            }, function (data) {
                // Swallow error counters will show 0 but not catastrophic
            });
        }
    }
})();