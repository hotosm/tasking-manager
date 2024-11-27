from cachetools import TTLCache, cached
from backend.models.dtos.settings_dto import SupportedLanguage, SettingsDTO
from backend.config import settings

settings_cache = TTLCache(maxsize=4, ttl=300)


class SettingsService:
    @staticmethod
    @cached(settings_cache)
    def get_settings():
        """Gets all settings required by the client"""
        settings_dto = SettingsDTO()
        settings_dto.mapper_level_advanced = settings.MAPPER_LEVEL_ADVANCED
        settings_dto.mapper_level_intermediate = settings.MAPPER_LEVEL_INTERMEDIATE
        settings_dto.supported_languages = SettingsService.get_supported_languages()
        return settings_dto

    @staticmethod
    def get_supported_languages():
        """Gets all supported languages from the config"""
        app_languages = settings.SUPPORTED_LANGUAGES

        codes = [x.strip() for x in app_languages["codes"].split(",")]
        languages = [x.strip() for x in app_languages["languages"].split(",")]

        supported_languages = []
        count = 0
        for code in codes:
            supported_language = SupportedLanguage()
            supported_language.code = code
            supported_language.language = languages[count]
            supported_languages.append(supported_language)
            count += 1

        return supported_languages
