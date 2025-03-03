from typing import List, Optional

from pydantic import BaseModel, Field


class SupportedLanguage(BaseModel):
    """Model representing language that Tasking Manager supports"""

    code: Optional[str] = None
    language: Optional[str] = None


class SettingsDTO(BaseModel):
    """DTO used to define available tags"""

    mapper_level_intermediate: Optional[str] = Field(
        None, alias="mapperLevelIntermediate"
    )
    mapper_level_advanced: Optional[str] = Field(None, alias="mapperLevelAdvanced")
    supported_languages: Optional[List[SupportedLanguage]] = Field(
        None, alias="supportedLanguages"
    )
