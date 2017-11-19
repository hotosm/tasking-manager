(function () {

    'use strict';

    /**
     * Message controller which manages a message
     */
    angular
        .module('taskingManager')
        .controller('messageController', ['$routeParams', 'messageService', messageController]);

    function messageController($routeParams, messageService) {
        var vm = this;
        vm.message = {};

        activate();

        function activate() {
            vm.messageId = $routeParams.id;
            getMessage(vm.messageId);
        }

        /**
         * Get a message
         */
        function getMessage(){
            var resultsPromise = messageService.getMessage(vm.messageId);
            resultsPromise.then(function (data) {
                // success
                vm.message = data;
                vm.message.message = messageService.formatUserNamesToLink(vm.message.message);
            }, function () {
                // an error occurred
            });
        }
    }
})();
