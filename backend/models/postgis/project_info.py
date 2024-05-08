# # from flask import current_app
from sqlalchemy.dialects.postgresql import TSVECTOR
from typing import List
import sqlalchemy as sa
from sqlalchemy import Column, String, Integer, ForeignKey, Index
from backend.models.dtos.project_dto import ProjectInfoDTO
from backend.db import Base, get_session
session = get_session()

class ProjectInfo(Base):
    """Contains all project info localized into supported languages"""

    __tablename__ = "project_info"

    project_id = Column(Integer, ForeignKey("projects.id"), primary_key=True)
    locale = Column(String(10), primary_key=True)
    name = Column(String(512))
    short_description = Column(String)
    description = Column(String)
    instructions = Column(String)
    project_id_str = Column(String)
    text_searchable = Column(
        TSVECTOR
    )  # This contains searchable text and is populated by a DB Trigger
    per_task_instructions = Column(String)

    __table_args__ = (
        Index("idx_project_info_composite", "locale", "project_id"),
        Index("textsearch_idx", "text_searchable"),
        {},
    )

    @classmethod
    def create_from_name(cls, name: str):
        """Creates a new ProjectInfo class from name, used when creating draft projects"""
        new_info = cls()
        new_info.locale = "en"  # Draft project default to english, PMs can change this prior to publication
        new_info.name = name
        return new_info

    @classmethod
    def create_from_dto(cls, dto: ProjectInfoDTO):
        """Creates a new ProjectInfo class from dto, used from project edit"""
        new_info = cls()
        new_info.update_from_dto(dto)
        return new_info

    def update_from_dto(self, dto: ProjectInfoDTO):
        """Updates existing ProjectInfo from supplied DTO"""
        self.locale = dto.locale
        self.name = dto.name
        self.project_id_str = str(self.project_id)  # Allows project_id to be searched

        # Note project info not bleached on basis that admins are trusted users and shouldn't be doing anything bad
        self.short_description = dto.short_description
        self.description = dto.description
        self.instructions = dto.instructions
        self.per_task_instructions = dto.per_task_instructions

    @staticmethod
    async def get_dto_for_locale(project_id, locale, default_locale="en", session=None) -> ProjectInfoDTO:
        """
        Gets the projectInfoDTO for the project for the requested locale. If not found, then the default locale is used
        :param project_id: ProjectID in scope
        :param locale: locale requested by user
        :param default_locale: default locale of project
        :raises: ValueError if no info found for Default Locale
        """
        project_info = await session.execute(sa.select(ProjectInfo).filter_by(
            project_id=project_id, locale=locale
        ))
        project_info = project_info.scalars().one_or_none()

        if project_info is None:
            # If project is none, get default locale and don't worry about empty translations
            project_info = await session.execute(sa.select(ProjectInfo).filter_by(
                project_id=project_id, locale=default_locale
            ))
            project_info = project_info.scalars().one_or_none()
            return project_info.get_dto()

        if locale == default_locale:
            # If locale == default_locale don't need to worry about empty translations
            return project_info.get_dto()

        default_locale = await session.execute(sa.select(ProjectInfo).filter_by(
            project_id=project_id, locale=default_locale
        ))
        default_locale = default_locale.scalars().one_or_none()

        if default_locale is None:
            error_message = f"BAD DATA: no info for project {project_id}, locale: {locale}, default {default_locale}"
            # current_app.logger.critical(error_message)
            raise ValueError(error_message)

        # Pass thru default_locale in case of partial translation
        return project_info.get_dto(default_locale)

    def get_dto(self, default_locale=ProjectInfoDTO()) -> ProjectInfoDTO:
        """
        Get DTO for current ProjectInfo
        :param default_locale: The default locale string for any empty fields
        """
        project_info_dto = ProjectInfoDTO()
        project_info_dto.locale = self.locale
        project_info_dto.name = self.name if self.name else default_locale.name
        project_info_dto.description = (
            self.description if self.description else default_locale.description
        )
        project_info_dto.short_description = (
            self.short_description
            if self.short_description
            else default_locale.short_description
        )
        project_info_dto.instructions = (
            self.instructions if self.instructions else default_locale.instructions
        )
        project_info_dto.per_task_instructions = (
            self.per_task_instructions
            if self.per_task_instructions
            else default_locale.per_task_instructions
        )

        return project_info_dto

    @staticmethod
    def get_dto_for_all_locales(project_id) -> List[ProjectInfoDTO]:
        locales = ProjectInfo.query.filter_by(project_id=project_id).all()

        project_info_dtos = []
        for locale in locales:
            project_info_dto = locale.get_dto()
            project_info_dtos.append(project_info_dto)

        return project_info_dtos
