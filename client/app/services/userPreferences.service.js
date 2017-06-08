(function () {
    'use strict';
    /**
     * @fileoverview This file provides a service for getting and setting user preferences and defaults.
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
            getlocalStorageUserPreferncesName: getlocalStorageUserPreferncesName,
            getFavouriteEditor: getFavouriteEditor,
            setFavouriteEditor: setFavouriteEditor
        };

        return service;

        function initialise() {
            if (localStorage.getItem(localStorageUserPreferncesName)) {
                userPrefences = JSON.parse(localStorage.getItem(localStorageUserPreferncesName));
            }
            else {
                localStorage.setItem(localStorageUserPreferncesName, JSON.stringify(userPrefences));
            }
        }

        function getlocalStorageUserPreferncesName(){
            return localStorageUserPreferncesName;
        }

        function getFavouriteEditor(){
            return userPrefences.favouriteEditor
        }

        function setFavouriteEditor(editorName){
            userPrefences.favouriteEditor = editorName;
            localStorage.setItem(localStorageUserPreferncesName, JSON.stringify(userPrefences));
        }
    }
})();