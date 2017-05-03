(function () {

    'use strict';

    /**
     * Message controller which manages a message
     */
    angular
        .module('taskingManager')
        .controller('messageController', [messageController]);

    function messageController() {
        var vm = this;
        vm.message = {};
       
        activate();

        function activate() {
            // TODO: get message from API
            vm.message = {
                username: 'LindaA1',
                subject: 'You were mentioned in a comment - Task #18',
                time: '2016-05-14T18:10:16Z',
                message: 'A few roads are missing. Please add them.'
            };
        }
    }
})();