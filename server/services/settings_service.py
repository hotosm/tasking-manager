from flask import current_app


class SettingsService:

    @staticmethod
    def get_supported_languages():
        """ Gets all supported languages from the config """
        app_languages = current_app.config['SUPPORTED_LANGUAGES']

        app_codes = [x.strip() for x in app_languages['codes'].split(',')]
        app_languages = [x.strip() for x in app_languages['languages'].split(',')]

        supported_languages = []
        count = 0
        for code in app_codes:
            supported_languages.append(dict(code=code, language=app_languages[count]))
            count += 1

        return dict(supportedLanguages=supported_languages)
