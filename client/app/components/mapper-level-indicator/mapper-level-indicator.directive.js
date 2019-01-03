(function () {

    'use strict';

    /**
     * @fileoverview This file provides a mapper-level indicator directive, by default
     * for the logged in user, but also allows passing explicit username and level attributes
     * for the indicator (as well as an optional label flag to show a description of the
     * mapper level next to the indicator icon).
     */

    angular
        .module('taskingManager')
        .controller('mapperLevelIndicatorController', ['$scope', '$location', 'accountService', mapperLevelIndicatorController])
        .directive('mapperLevelIndicator', mapperLevelIndicatorDirective);

    /**
     * Creates mapper-level-indicator directive
     * Example:
     *
     * <mapper-level-indicator></mapper-level-indicator>
     */
    function mapperLevelIndicatorDirective() {

        var directive = {
            restrict: 'EA',
            templateUrl: 'app/components/mapper-level-indicator/mapper-level-indicator.html',
            controller: 'mapperLevelIndicatorController',
            controllerAs: 'mapperLevelCtrl',
            bindToController: {
                label: '@',    // show descriptive label next to the indicator icon
                level: '@',    // explicitly specify a mapping level for the indicator
                username: '@', // explicitly specify username for indicator
            },
        };

        return directive;
    }

    function mapperLevelIndicatorController($scope, $location, accountService) {

        var vm = this;
        vm.account = {};

        // Watch the accountService for changes and update when needed
        $scope.$watch(function () {
            return accountService.getAccount();
        }, function (account) {
            vm.account = account;
        }, true);

        /**
         * Get the mapper level for this indicator, which defaults to the
         * logged-in user's level, but can be overriden if a level attribute
         * was explicitly specified
         */
        vm.mapperLevel = function() {
            if (vm.level) {
                return vm.level;
            }
            else if (vm.account) {
                return vm.account.mappingLevel;
            }
            else {
                return null;
            }
        };

        /**
          * Navigate to the user's profile
          */
        vm.goToProfile = function () {
            var username = vm.username ? vm.username : vm.account.username;
            $location.path('user/' + username);
        };
    }
})();
