'use strict';

describe('userPreferencesService.service', function () {
    var userPreferencesService = null;

    beforeEach(function () {
        module('taskingManager');

        inject(function (_userPreferencesService_) {
            userPreferencesService = _userPreferencesService_;
        });
    });

    it('should be created successfully', function () {
        expect(userPreferencesService).toBeDefined()
    });

    it('should return josm', function () {

        //arrange
        localStorage.removeItem(userPreferencesService.getlocalStorageUserPreferencesName());
        userPreferencesService.initialise();
        userPreferencesService.setFavouriteEditor('josm');

        //act
        var editor = userPreferencesService.getFavouriteEditor();

        //assert
        expect(editor).toEqual('josm');
    });

    afterEach(function(){
        localStorage.removeItem(userPreferencesService.getlocalStorageUserPreferencesName());
    });

    it('should return English', function () {

        //arrange
        localStorage.removeItem(userPreferencesService.getlocalStorageUserPreferencesName());
        userPreferencesService.initialise();
        var language = {
            language: "English",
            code: "en"
        }
        userPreferencesService.setLanguage(language);

        //act
        var language = userPreferencesService.getLanguage();

        //assert
        expect(language.language).toEqual('English');
    });

    afterEach(function(){
        localStorage.removeItem(userPreferencesService.getlocalStorageUserPreferencesName());
    });
});