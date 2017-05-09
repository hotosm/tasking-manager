(function () {
    'use strict';
    /**
     * @fileoverview This is where all the custom filters live
     */

    angular
        .module('taskingManager')

        .filter('addTargetBlank', function () {
            // This filter finds a tags and sets the target attribute to blank
            return function (x) {
                var tree = angular.element('<div>' + x + '</div>');//defensively wrap in a div to avoid 'invalid html' exception
                tree.find('a').attr('target', '_blank'); //manipulate the parse tree
                return angular.element('<div>').append(tree).html(); //trick to have a string representation
            }
        });
})();