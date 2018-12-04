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
        vm.hasLoaded = false;
        vm.mappersOnline = 0;
        vm.tasksMapped = 0;
        vm.totalMappers = 0;
        vm.closed = false;

        activate();

        function activate() {
            getHomePageStats();
        }

        /**
         * Gets mapping stats for display on homepage
         */
        function getHomePageStats() {
            var resultsPromise = statsService.getHomePageStats();
            resultsPromise.then(function (data) {
                vm.stats = data;
                console.log(vm.stats);
                vm.hasLoaded = true;
                vm.mappersOnline = data.mappersOnline;
                vm.tasksMapped = data.tasksMapped;
                vm.totalMappers = data.totalMappers;
            }, function (data) {
                // Swallow error counters will show loading animation but not catastrophic
            });
        }

        // Add opt out form
        function setOptOutText(element) {
        _paq.push([function() {
            element.checked = !this.isUserOptedOut();
            document.querySelector('label[for=optout] strong').innerText = this.isUserOptedOut()
                ? 'You are currently opted out. Click here to opt in.'
                : 'You are currently opted in. Click here to opt out.';
            }]);
        }

        var optOut = document.getElementById("optout");
        optOut.addEventListener("click", function() {
            if (this.checked) {
                _paq.push(['forgetUserOptOut']);
            } else {
                _paq.push(['optUserOut']);
            }
            setOptOutText(optOut);
        });
        setOptOutText(optOut);

        function hide() {
            // saves local storage
            localStorage.setItem("optout-closed", 1);
            vm.closed = !vm.closed;
            console.log(vm.closed);
        }
    }
})();