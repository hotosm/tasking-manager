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
        vm.tasksMapped = 1123123;
        vm.totalMappers = 62123;

        activate();

        function activate() {
            console.log('iain');
            getHomePageStats();
        }


        function getHomePageStats() {
            var resultsPromise = statsService.getHomePageStats();
            resultsPromise.then(function (data) {
                vm.stats = data;
                vm.mappersOnline = vm.stats.mappersOnline;
            }, function (data) {
                // TODO
            });
        }
    }
})();