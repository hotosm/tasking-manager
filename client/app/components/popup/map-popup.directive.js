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
            vm.projectDetails.projectId = data.projectId;
            vm.projectDetails.projectName = data.name;
            vm.projectDetails.mapperLevel = data.mapperLevel;
            vm.projectDetails.organisationTag = data.organisationTag;
            vm.projectDetails.shortDescription = data.shortDescription;
            vm.projectDetails.percentMapped = data.percentMapped;
            vm.projectDetails.percentValidated = data.percentValidated;
            vm.projectDetails.projectStatus = data.status;
        });

        vm.close = function(){
            projectMapService.closePopup();
        };
    }
})();
