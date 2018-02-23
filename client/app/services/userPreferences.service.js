(function () {
    'use strict';
    /**
     * @fileoverview This file provides a service for getting and setting user preferences and defaults which are
     * persisted in localstorage (cookies).
     */

    angular
        .module('taskingManager')
        .service('userPreferencesService', ['$window', userPreferencesService]);

    function userPreferencesService() {

        var userPreferences = {
            favouriteEditor: 'ideditor',
            language: ''
        };
        var localStorageUserPreferencesName = 'hottm-user-preferences';

        var service = {
            initialise: initialise,
            getlocalStorageUserPreferencesName: getlocalStorageUserPreferencesName,
            getFavouriteEditor: getFavouriteEditor,
            setFavouriteEditor: setFavouriteEditor,
            getLanguage: getLanguage,
            setLanguage: setLanguage
        };

        return service;

        /**
         * Set up the service object by synchrinosing with local storage
         */
        function initialise() {
            if (localStorage.getItem(localStorageUserPreferencesName)) {
                userPreferences = JSON.parse(localStorage.getItem(localStorageUserPreferencesName));
            }
            else {
                localStorage.setItem(localStorageUserPreferencesName, JSON.stringify(userPreferences));
            }
        }

        /**
         * Get the name of the local storage object used to store user preferences
         * @returns {string}
         */
        function getlocalStorageUserPreferencesName() {
            return localStorageUserPreferencesName;
        }

        /**
         * Get the user's favourite editor
         * @returns {string}
         */
        function getFavouriteEditor() {
            return userPreferences.favouriteEditor
        }

        /**
         * Set the user's editor and persist to localstorage
         * @param editorName
         */
        function setFavouriteEditor(editorName) {
            userPreferences.favouriteEditor = editorName;
            localStorage.setItem(localStorageUserPreferencesName, JSON.stringify(userPreferences));
        }

         /**
         * Get the user's preferred language
         * @returns {string}
         */
        function getLanguage() {
            return userPreferences.language;
        }

        /**
         * Set the user's preferred language
         * @param language
         */
        function setLanguage(language){
            userPreferences.language = language;
            localStorage.setItem(localStorageUserPreferencesName, JSON.stringify(userPreferences));
        }
    }
})();
