(function () {

    'use strict';

    /**
     * @fileoverview This file provides a map pin popup directive.
     */

    angular
        .module('taskingManager')
        .controller('mapPopupController', ['$scope','projectMapService','mapService', mapPopupController])
        .directive('mapPopup', mapPopupDirective);

    /**
     * Creates map-popup directive
     * Example:
     *
     * <map-popup></map-popup>
     */
    function mapPopupDirective() {

        var directive = {
            restrict: 'EA',
            templateUrl: 'app/components/popup/mapPopup.html',
            controller: 'mapPopupController',
            controllerAs: 'mapPopupCtrl',
            scope: {
                selectedFeature: '=selectedFeature'
            },
            bindToController: true // because the scope is isolated
        };

        return directive;
    }

    function mapPopupController($scope, projectMapService) {

        var vm = this;
        vm.feature;
        vm.projectDetails = {};

        /**
         * Watches the selected feature
         */
        $scope.$watch('mapPopupCtrl.selectedFeature', function(selectedFeature) {
            console.log(selectedFeature.getProperties().projectId);
            vm.feature = selectedFeature;
            vm.projectDetails.projectId = vm.feature.getProperties().projectId;
            vm.projectDetails.projectName = vm.feature.getProperties().projectName;
            vm.projectDetails.mapperLevel = vm.feature.getProperties().mapperLevel;
            vm.projectDetails.organisationTag = vm.feature.getProperties().organisationTag;
            vm.projectDetails.shortDescription = vm.feature.getProperties().shortDescription;
        });

        vm.close = function(){
            projectMapService.closePopup();
        };
    }
})();