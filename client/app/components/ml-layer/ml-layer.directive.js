(function () {

    'use strict';

    /**
     * @fileoverview This file provides a add ml layer directive.
     */

    angular
        .module('taskingManager')
        .controller('mlLayerController', ['$scope', mlLayerController])
        .directive('mlLayer', MlLayerDirective);

    /**
     * Creates ml-layer directive
     * Example:
     *
     * <ml-layer></ml-layer>
     */
    function MlLayerDirective() {

        var directive = {
            restrict: 'EA',
            templateUrl: 'app/components/ml-layer/ml-layer.html',
            controller: 'mlLayerController',
            controllerAs: 'mlLayerCtrl',
            bindToController: true // because the scope is isolated
        };

        return directive;
    }

    function mlLayerController($scope) {

        var vm = this;
        vm.type = 'looking_glass';
        vm.isVisible = false;

         /**
         * Add ml-layer
         * Supported types:
         *  - looking_glass 
         *  - building_api 
         */
        vm.addMlLayer = function(){
            $scope.$emit('addMlLayerEvent', vm.type);
            vm.isVisible = false;
        };

        vm.toggleVisibility = function(){
            vm.isVisible = !vm.isVisible;
        }
    }
})();
