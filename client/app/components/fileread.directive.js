(function () {

    'use strict';

    /**
     * @fileoverview This file provides a fileread directive. It uses a FileReader to read the file and
     * updates the scope. You can't automatically bind changes from <input type="file"> to the controller.
     * By using the directive, you can access the file value.
     *
     * Example usage:
     *       <input type="file" class="form__control" fileread="editProjectCtrl.josmPreset"/>
     */

    angular
        .module('taskingManager')
        .directive('fileread', fileReadDirective);

    function fileReadDirective() {
        return {
            scope: {
                fileread: "="
            },
            link: function (scope, element) {
                element.bind("change", function (changeEvent) {
                    var reader = new FileReader();
                    reader.onload = function (loadEvent) {
                        scope.$apply(function () {
                            scope.fileread = loadEvent.target.result;
                        });
                    };
                    reader.readAsText(changeEvent.target.files[0]);
                });
            }
        }
    }

})();
