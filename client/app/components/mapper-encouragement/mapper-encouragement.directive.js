(function () {

    'use strict';

    /**
     * @fileoverview This file provides methods for determining which messages
     * to display to mappers to encourage them to get to the next mapping level
     */

    angular
        .module('taskingManager')
        .controller('mapperEncouragementController', ['$scope', 'accountService', 'userService', 'settingsService', mapperEncouragementController])
        .directive('mapperEncouragement', mapperEncouragementDirective);

    /**
     * Creates mapper-encouragement directive
     * Example:
     *
     * <mapper-encouragement></mapper-encouragement>
     */
    function mapperEncouragementDirective() {
        var directive = {
            restrict: 'EA',
            templateUrl: 'app/components/mapper-encouragement/mapper-encouragement.html',
            controller: 'mapperEncouragementController',
            controllerAs: 'encouragementCtrl',
        };

        return directive;
    }

    function mapperEncouragementController($scope, accountService, userService, settingsService) {
        var vm = this;
        vm.account = {};
        vm.mapperLevelIntermediate = 0;
        vm.mapperLevelAdvanced = 0;
        vm.mapperLevelsLoaded = false;

        // Watch the accountService for changes and update when needed
        $scope.$watch(function () {
            return accountService.getAccount();
        }, function (account) {
            vm.account = account;

            if (vm.account) {
                // Fetch OSM details, which includes user's number of changesets
                var osmDetailsPromise = userService.getOSMUserDetails(vm.account.username);
                osmDetailsPromise.then(function (data) {
                    // On success, set the OSM account details for this user
                    vm.osmUserDetails = data;
                });
            }
        }, true);

        settingsService.getSettings().then(function (data) {
            vm.mapperLevelIntermediate = data.mapperLevelIntermediate;
            vm.mapperLevelAdvanced = data.mapperLevelAdvanced;
            vm.mapperLevelsLoaded = true;
        });

        /**
         * Returns true when all the needed data has been fetched
         */
        vm.ready = function() {
            return vm.account && vm.mapperLevelsLoaded && vm.osmUserDetails;
        }

        /**
         * Returns the number of changesets completed at the logged-in user's
         * current level (versus their total changeset count). Returns null if
         * it can't be computed
         */
        vm.completedIncrementalChangesets = function() {
            if (vm.ready()) {
                if (vm.account.mappingLevel === 'BEGINNER') {
                    return vm.osmUserDetails.changesetCount;
                }
                else if (vm.account.mappingLevel === 'INTERMEDIATE') {
                    return vm.osmUserDetails.changesetCount - vm.mapperLevelIntermediate;
                }
                else if (vm.account.mappingLevel === 'ADVANCED') {
                    return vm.osmUserDetails.changesetCount - vm.mapperLevelAdvanced;
                }
            }

            return null;
        };

        /**
         * Returns the incremental number of changesets required to advance to
         * the next level. Returns null if it can't be computed or user is
         * already an advanced mapper
         */
        vm.requiredIncrementalChangesets = function() {
            if (vm.ready()) {
                if (vm.account.mappingLevel === 'BEGINNER') {
                    return vm.mapperLevelIntermediate;
                }
                else if (vm.account.mappingLevel === 'INTERMEDIATE') {
                    return vm.mapperLevelAdvanced - vm.mapperLevelIntermediate;
                }
            }

            return null;
        };

        /**
         * Computes the percentage mapping progress of the logged-in user needed
         * to advance to the next level (i.e. 90% of the way there). Returns
         * null if it can't be computed or if the user is already an advanced
         * mapper and thus can't advance any further
         */
        vm.mappingAdvancementProgress = function() {
            if (vm.ready() && vm.account.mappingLevel !== 'ADVANCED') {
                return vm.completedIncrementalChangesets() / vm.requiredIncrementalChangesets();
            }

            return null;
        };

        /**
         * Determines if the logged-in user is at least 90% of the way to the
         * next mapping level
         */
        vm.isCloseToAdvancement = function() {
            return vm.mappingAdvancementProgress() >= 0.9;
        };

        /**
         * Determines if the logged-in user is at least halfway to the next
         * mapping level
         */
        vm.isHalfwayToAdvancement = function() {
            return vm.mappingAdvancementProgress() >= 0.5;
        };

        /**
         * Determines if the logged-in user has recently been promoted to a new
         * mapping level (is less than 10% of the way to the next one)
         */
        vm.isNewlyPromoted = function() {
            return vm.mappingAdvancementProgress() < 0.1;
        };

        /**
         * Determines if the logged-in user has ever mapped
         */
        vm.hasMapped = function() {
            return vm.account && vm.account.tasksMapped > 0;
        };

        /**
         * Determines if the logged-in user has ever performed validation
         */
        vm.hasValidated = function() {
            return vm.account &&
                   vm.account.tasksValidated > 0 || vm.account.tasksInvalidated > 0;
        };
    }
})();
