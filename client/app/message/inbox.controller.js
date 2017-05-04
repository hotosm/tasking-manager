(function () {

    'use strict';

    /**
     * Inbox controller which manages a user's inbox
     */
    angular
        .module('taskingManager')
        .controller('inboxController', ['messageService', inboxController]);

    function inboxController(messageService) {
        var vm = this;
        vm.messages = [];
        vm.showDeleteMessageModal = false;
       
        activate();

        function activate() {
            getAllMessages();
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
         * Delete a message
         * @param messageId
         */
        vm.deleteMessage = function(){
            vm.deleteMessageFail = false;
            var resultsPromise = messageService.deleteMessage(vm.messageIdToBeDeleted);
            resultsPromise.then(function (data) {
                // success
                vm.showDeleteMessageModal = false;
                getAllMessages();
            }, function () {
                // an error occurred
                 vm.deleteMessageFail = true;
            });
        };

        /**
         * Get all messages for a user
         */
        function getAllMessages(){
            var resultsPromise = messageService.getAllMessages();
            resultsPromise.then(function (data) {
                // success
                vm.messages = data.userMessages;
            }, function () {
                // an error occurred
                vm.messages = [];
            });
        }
    }
})();