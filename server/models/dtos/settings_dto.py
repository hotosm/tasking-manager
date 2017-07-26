from schematics import Model
from schematics.types import StringType
from schematics.types.compound import ListType, ModelType


class SupportedLanguage(Model):
    """ Model representing language that Tasking Manager supports """
    code = StringType()
    language = StringType()


class SettingsDTO(Model):
    """ DTO used to define available tags """
    mapper_level_intermediate = StringType(serialized_name='mapperLevelIntermediate')
    mapper_level_advanced = StringType(serialized_name='mapperLevelAdvanced')
    supported_languages = ListType(ModelType(SupportedLanguage), serialized_name='supportedLanguages')
