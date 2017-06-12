(function () {

    'use strict';

    /**
     * @fileoverview This file provides a map popup directive.
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
        vm.characterLimitShortDescription = 100;

        /**
         * Watches the selected feature
         */
        $scope.$watch('mapPopupCtrl.selectedFeature', function(data) {

            vm.feature = data;
            vm.projectDetails.projectId = vm.feature.projectId;
            vm.projectDetails.projectName = vm.feature.projectInfo.name;
            vm.projectDetails.mapperLevel = vm.feature.mapperLevel;
            vm.projectDetails.organisationTag = vm.feature.organisationTag;
            vm.projectDetails.shortDescription = vm.feature.projectInfo.shortDescription;
            vm.projectDetails.percentMapped = vm.feature.percentMapped;
            vm.projectDetails.percentValidated = vm.feature.percentValidated;
            vm.projectDetails.projectStatus = vm.feature.projectStatus;
        });

        vm.close = function(){
            projectMapService.closePopup();
        };
    }
})();