(function () {

    'use strict';

    /**
     * Inbox controller which manages a user's inbox
     */
    angular
        .module('taskingManager')
        .controller('inboxController', ['NgTableParams', 'messageService', 'MessageType', inboxController]);

    function inboxController(NgTableParams, messageService, MessageType) {
        var vm = this;
        vm.messages = [];
        vm.selectedIndividualMessages = new Map();
        vm.allVisibleMessagesSelected = false;
        vm.showDeleteMessageModal = false;
        vm.showDeleteSelectedMessagesModal = false;
        vm.errorRetrievingMessages = false;
        vm.messageTypeLabels = [
          {title: 'All', id: ''},
          {title: 'System', id: MessageType.SYSTEM},
          {title: 'Broadcast', id: MessageType.BROADCAST},
          {title: 'Mention', id: MessageType.MENTION_NOTIFICATION},
          {title: 'Validated', id: MessageType.VALIDATION_NOTIFICATION},
          {title: 'Invalidated', id: MessageType.INVALIDATION_NOTIFICATION},
        ];

        vm.inboxTableSettings = new NgTableParams({
           sorting: {sentDate: "desc"},
           filter: {},
           count: 10,
        }, {
          counts: [10, 25, 50, 100],
          getData: function(params) {
            var sortBy = Object.keys(params.sorting())[0]
            vm.errorRetrievingMessages = false;
            return messageService.getAllMessages(
              params.page(), params.count(),
              sortBy, sortBy ? params.sorting()[sortBy] : undefined,
              params.filter().username,
              params.filter().projectTitle,
              params.filter().taskId,
              params.filter().messageType
            ).then(function(data) {
                // success
                vm.inboxPagination = data.pagination;
                vm.selectedIndividualMessages.clear();
                vm.allVisibleMessagesSelected = false;
                vm.messages = data.userMessages;
                if (vm.messages){
                    for (var i = 0; i < vm.messages.length; i++){
                        vm.messages[i].subject = htmlToPlaintext(vm.messages[i].subject);
                    }
                }
                params.total(data.pagination.total);
                return vm.messages;
            }, function (error) {
                // an error occurred
                if (error.status !== 404){
                    vm.errorRetrievingMessages = true;
                }
                vm.inboxPagination = null;
                vm.selectedIndividualMessages.clear();
                vm.allVisibleMessagesSelected = false;
                vm.messages = [];
                params.total(0);
              });
          }
        })

        /**
         * Retrieve the label for the given string form of MessageType
         * @param typeString
         */
        vm.messageTypeLabelFor = function(typeString) {
          var label = vm.messageTypeLabels.find(function(label) {
            return label.id === MessageType[typeString];
          });

          return label ? label.title : '';
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
         */
        vm.deleteMessage = function(){
            vm.deleteMessageFail = false;
            var resultsPromise = messageService.deleteMessage(vm.messageIdToBeDeleted);
            resultsPromise.then(function (data) {
                // success
                vm.showDeleteMessageModal = false;
                vm.inboxTableSettings.reload();
            }, function () {
                // an error occurred
                 vm.deleteMessageFail = true;
            });
        };

        /**
         * Set the delete selected messages modal to visible/invisible
         */
        vm.setShowDeleteSelectedMessagesModal = function(showModal) {
          vm.showDeleteSelectedMessagesModal = showModal;
        };

        /**
         * Delete selected messages
         */
        vm.deleteSelectedMessages = function(){
            vm.deleteMessageFail = false;
            var resultsPromise = null;
            if (vm.allVisibleMessagesSelected) {
                resultsPromise = messageService.deleteMultipleMessages(vm.messages.map(function(message) {
                  return message.messageId;
                }));
            }
            else {
              resultsPromise =
                  messageService.deleteMultipleMessages(Array.from(vm.selectedIndividualMessages.keys()));
            }
            resultsPromise.then(function (data) {
                // success
                vm.showDeleteSelectedMessagesModal = false;
                vm.selectedIndividualMessages.clear();
                vm.allVisibleMessagesSelected = false;
                vm.inboxTableSettings.reload();
            }, function () {
                // an error occurred
                vm.deleteMessageFail = true;
                vm.showDeleteSelectedMessagesModal = false;
            });
        };

        /**
         * Toggle selection of an individual message
         */
        vm.toggleIndividualMessageSelection = function(messageId){
          // If all messages are currently selected and we're unselecting a single
          // message, we have to switch to individually selecting everything
          // except the target message
          if (vm.allVisibleMessagesSelected) {
            vm.allVisibleMessagesSelected = false;
            vm.messages.forEach(function(message) {
                vm.selectedIndividualMessages.set(message.messageId, true);
            });
            vm.selectedIndividualMessages.delete(messageId);
          }
          else {
            // Simply toggle message off or on depending on its current state
            if (vm.selectedIndividualMessages.has(messageId)) {
              vm.selectedIndividualMessages.delete(messageId);
            }
            else {
              vm.selectedIndividualMessages.set(messageId, true);
            }
          }
        };

        /**
         * Toggle selection of all visible messages. This automatically removes
         * any selection of individual messages
         */
        vm.toggleAllVisibleMessagesSelected = function() {
          vm.allVisibleMessagesSelected = !vm.allVisibleMessagesSelected;
          vm.selectedIndividualMessages.clear();
        };

        /**
         * Determine if at least one message is currently selected
         */
        vm.isAnyMessageSelected = function() {
            return vm.allVisibleMessagesSelected || vm.selectedIndividualMessages.size > 0
        };

        /**
         * Convert HTML to plain text to remove the link in the subject
         * @param text
         * @returns {string}
         */
        function htmlToPlaintext(text) {
            return text ? String(text).replace(/<[^>]+>/gm, '') : '';
        }
    }
})();
