(function () {
    'use strict';
    /**
     * @fileoverview This file provides a service for getting and setting user preferences and defaults which are
     * persisted in localstorage (cookies).
     */

    angular
        .module('taskingManager')
        .service('userPreferencesService', ['$window', userPreferencesService]);

    function userPreferencesService($window) {

        var userPrefences = {
            favouriteEditor: 'ideditor'
        };
        var localStorageUserPreferncesName = 'hottm-user-preferences';

        var service = {
            initialise: initialise,
            getlocalStorageUserPreferencesName: getlocalStorageUserPreferencesName,
            getFavouriteEditor: getFavouriteEditor,
            setFavouriteEditor: setFavouriteEditor
        };

        return service;

        /**
         * Set up the service object by synchrinosing with local storage
         */
        function initialise() {
            if (localStorage.getItem(localStorageUserPreferncesName)) {
                userPrefences = JSON.parse(localStorage.getItem(localStorageUserPreferncesName));
            }
            else {
                localStorage.setItem(localStorageUserPreferncesName, JSON.stringify(userPrefences));
            }
        }

        /**
         * Get the name of the local storage object used to store user preferences
         * @returns {string}
         */
        function getlocalStorageUserPreferencesName() {
            return localStorageUserPreferncesName;
        }

        /**
         * Get the user's favourite editor
         * @returns {string}
         */
        function getFavouriteEditor() {
            return userPrefences.favouriteEditor
        }

        /**
         * Set the user's editor and persist to localstorage
         * @param editorName
         */
        function setFavouriteEditor(editorName) {
            userPrefences.favouriteEditor = editorName;
            localStorage.setItem(localStorageUserPreferncesName, JSON.stringify(userPrefences));
        }
    }
})();
