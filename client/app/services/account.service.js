(function () {
    'use strict';
    /**
     * @fileoverview This file provides a account service.
     */

    angular
        .module('taskingManager')
        .service('accountService', [accountService]);

    function accountService() {

        var account = {
            emailAddress: '',
            firstName: '',
            surname: ''
        };

        var service = {
            setAccount: setAccount,
            getAccount: getAccount
        };

        return service;

        /**
         * Sets the account details 
         * @param accountDetails
         */
        function setAccount(accountDetails){
            account = accountDetails;
        }

        /**
         * Returns the account details
         * @returns 
         */
        function getAccount() {
            return account;
        }
    }
})();