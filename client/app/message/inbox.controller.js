(function () {

    'use strict';

    /**
     * Inbox controller which manages a user's inbox
     */
    angular
        .module('taskingManager')
        .controller('inboxController', [inboxController]);

    function inboxController() {
        var vm = this;
        vm.messages = [];
       
        activate();

        function activate() {
            // TODO: get messages from API
            vm.messages = [
                {
                    username: 'LindaA1',
                    subject: 'You were mentioned in a comment - Task #18',
                    date: '2016-05-14T18:10:16Z',
                    id: 1
                },
                {
                    username: 'popeln',
                    subject: 'You were mentioned in a comment - Task #20',
                    date: '2015-05-14T18:10:16Z',
                    id: 2
                }
            ]
        }
    }
})();