(function () {
    'use strict';
    /**
     * @fileoverview This is where all the custom filters live
     */

    angular
        .module('taskingManager', [])

        // This filter finds a tags and sets the target attribute to blank
        .filter('addTargetBlank', function () {
            return function (x) {
                var tree = angular.element('<div>' + x + '</div>');//defensively wrap in a div to avoid 'invalid html' exception
                tree.find('a').attr('target', '_blank'); //manipulate the parse tree
                return angular.element('<div>').append(tree).html(); //trick to have a string representation
            }
        });
})();