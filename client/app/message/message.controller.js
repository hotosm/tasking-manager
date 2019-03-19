(function () {

    'use strict';

    /**
     * Message controller which manages a message
     */
    angular
        .module('taskingManager')
        .controller('messageController', ['$routeParams', 'messageService', '$location', messageController]);

    function messageController($routeParams, messageService, $location) {
        var vm = this;
        vm.message = {};
        vm.showDeleteMessageModal = false;
        vm.errorRetrievingMessages = false;
        vm.errorMessage = [];

        activate();

        function activate() {
            vm.messageId = $routeParams.id;
            getMessage(vm.messageId);
        }

        /**
         * Get a message
         */
        function getMessage(){
            vm.errorRetrievingMessages = false;
            var resultsPromise = messageService.getMessage(vm.messageId);
            resultsPromise.then(function (data) {
                // success
                vm.message = data;
                vm.message.message = messageService.formatShortCodes(vm.message.message);
            }, function (error) {
                    vm.errorMessage = error.data.Error;
                    vm.errorRetrievingMessages = true;
            });
        }

        /**
         * Set the delete message modal to visible/invisible
         * @param showModal
         */
        vm.setShowDeleteMessageModal = function(showModal){
            vm.showDeleteMessageModal = showModal;
        };

        /**
         * Confirm deleting a message
         * @param messageId
         */
        vm.confirmDeleteMessage = function(messageId){
            vm.messageIdToBeDeleted = messageId;
            vm.showDeleteMessageModal = true;
        };
        
        /** 
         * Redirect to inbox after message is deleted
        **/
        vm.redirectAfterDelete = function(){
            vm.showDeleteMessageModal = false;
            $location.path('/inbox');
        }

        /**
         * Delete a message
         */
        vm.deleteMessage = function(id){
            vm.deleteMessageFail = false;
            var resultsPromise = messageService.deleteMessage(id);
            resultsPromise.then(function (data) {
                // success
                vm.redirectAfterDelete();   
            }, function () {
                // an error occurred
                vm.deleteMessageFail = true;
            });    
        };


    }
})();
