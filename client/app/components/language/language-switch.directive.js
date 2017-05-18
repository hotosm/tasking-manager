(function () {

    'use strict';

    /**
     * @fileoverview This file provides a language switch directive.
     * 
     * It creates language-switch directive
     * Example:
     *
     * <language-switch></language-switch>
     */

    angular
        .module('taskingManager')
        .controller('languageSwitchController', ['$scope','$document','$element', '$translate','languageService', languageSwitchController])
        .directive('languageSwitch', languageSwitchDirective);
    
    function languageSwitchDirective() {

        var directive = {
            restrict: 'EA',
            templateUrl: 'app/components/language/language-switch.html',
            controller: 'languageSwitchController',
            controllerAs: 'languageSwitchCtrl',
            bindToController: true // because the scope is isolated
        };

        return directive;
    }

    function languageSwitchController($scope, $document, $element, $translate, languageService) {

        var vm = this;
        vm.showDropdown = false;
        vm.selectedLanguage = 'English'; // defaults to English
        // TODO: get from API
        vm.availableLanguages = [
            {
                'key': 'en',
                'value': 'English'
            },
            {
                'key': 'nl_NL',
                'value': 'Nederlands'
            }
        ];

        activate();

        function activate() {
            // TODO
            
             // Catch clicks and check if it was outside of the menu element. If so, close the dropdown menu.
            $document.bind('click', function(event){
                var isClickedElementChildOfPopup = $element
                  .find(event.target)
                  .length > 0;
                if (isClickedElementChildOfPopup)
                  return;

                vm.showDropdown = false;
                $scope.$apply();
            });
        }
        
        /**
         * Toggle the menu
         */
        vm.toggleMenu = function(event){
            vm.showDropdown = !vm.showDropdown;
            // Do not let the event propagate. Otherwise it would check if the click was inside the menu div and
            // always close the dropdown menu
            event.stopPropagation();
        };

        /**
         * Switch language
         * @param key
         */
        vm.switchLanguage = function(language){
            $translate.use(language.key);
            vm.selectedLanguage = language.value;
            languageService.setLanguageCode(language.key);
        }
    }
})();