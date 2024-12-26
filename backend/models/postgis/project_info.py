from typing import List

from databases import Database
from sqlalchemy import (
    Column,
    ForeignKey,
    Index,
    Integer,
    String,
    insert,
    inspect,
    update,
)
from sqlalchemy.dialects.postgresql import TSVECTOR

from backend.db import Base
from backend.models.dtos.project_dto import ProjectInfoDTO


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
    async def create_from_dto(cls, dto: ProjectInfoDTO, project_id: int, db: Database):
        """Creates a new ProjectInfo class from dto, used from project edit"""
        self = cls()
        self.locale = dto.locale
        self.name = dto.name
        self.project_id = project_id
        self.project_id_str = str(project_id)  # Allows project_id to be searched

        # Note project info not bleached on basis that admins are trusted users and shouldn't be doing anything bad
        self.short_description = dto.short_description
        self.description = dto.description
        self.instructions = dto.instructions
        self.per_task_instructions = dto.per_task_instructions
        columns = {
            c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs
        }
        query = insert(ProjectInfo.__table__).values(**columns)
        result = await db.execute(query)
        return result

    async def update_from_dto(self, dto: ProjectInfoDTO, db: Database):
        """Updates existing ProjectInfo from supplied DTO"""
        # self.locale = dto.locale
        self.name = dto.name
        self.project_id_str = str(self.project_id)  # Allows project_id to be searched

        # Note project info not bleached on basis that admins are trusted users and shouldn't be doing anything bad
        self.short_description = dto.short_description
        self.description = dto.description
        self.instructions = dto.instructions
        self.per_task_instructions = dto.per_task_instructions
        columns = {
            c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs
        }
        columns.pop("project_id", None)
        columns.pop("locale", None)
        query = (
            update(ProjectInfo.__table__)
            .where(
                ProjectInfo.project_id == self.project_id,
                ProjectInfo.locale == self.locale,
            )
            .values(**columns)
        )
        result = await db.execute(query)
        return result

    @staticmethod
    async def get_dto_for_locale(
        db: Database, project_id: int, locale: str, default_locale: str = "en"
    ) -> ProjectInfoDTO:
        """
        Gets the ProjectInfoDTO for the project for the requested locale. If not found, then the default locale is used.
        :param db: The async database connection
        :param project_id: ProjectID in scope
        :param locale: Locale requested by user
        :param default_locale: Default locale of project
        :return: ProjectInfoDTO
        :raises: ValueError if no info found for Default Locale
        """
        query = """
            SELECT * FROM project_info
            WHERE project_id = :project_id AND locale = :locale
        """
        # Execute the query for the requested locale
        project_info = await db.fetch_one(
            query, values={"project_id": project_id, "locale": locale}
        )
        if project_info is None:
            # Define the SQL query to get project info by default locale
            query_default = """
                SELECT * FROM project_info
                WHERE project_id = :project_id AND locale = :default_locale
            """

            # Execute the query for the default locale
            project_info = await db.fetch_one(
                query_default,
                values={"project_id": project_id, "default_locale": default_locale},
            )

            if project_info is None:
                error_message = f"BAD DATA: no info for project {project_id}, locale: {locale}, default {default_locale}"
                raise ValueError(error_message)

            return ProjectInfoDTO(**project_info)

        if locale == default_locale:
            # Return the DTO for the default locale
            return ProjectInfoDTO(**project_info)
        # Define the SQL query to get project info by default locale for partial translations
        query_default = """
            SELECT * FROM project_info
            WHERE project_id = :project_id AND locale = :default_locale
        """

        # Execute the query for the default locale
        default_locale_info = await db.fetch_one(
            query_default,
            values={"project_id": project_id, "default_locale": default_locale},
        )

        if default_locale_info is None:
            error_message = f"BAD DATA: no info for project {project_id}, locale: {locale}, default {default_locale}"
            raise ValueError(error_message)

        combined_info = ProjectInfoDTO(locale=project_info.locale)
        combined_info.name = (
            project_info.name if project_info.name else default_locale_info.name
        )
        combined_info.description = (
            project_info.description
            if project_info.description
            else default_locale_info.description
        )
        combined_info.short_description = (
            project_info.short_description
            if project_info.short_description
            else default_locale_info.short_description
        )
        combined_info.instructions = (
            project_info.instructions
            if project_info.instructions
            else default_locale_info.instructions
        )
        combined_info.per_task_instructions = (
            project_info.per_task_instructions
            if project_info.per_task_instructions
            else default_locale_info.per_task_instructions
        )
        return combined_info

    # Function to get a single ProjectInfoDTO
    async def get_project_info_dto(locale_record) -> ProjectInfoDTO:
        """
        Get DTO for the current ProjectInfo
        :param locale_record: The record from the database for the locale
        :param default_locale: The default locale DTO for any empty fields
        :return: ProjectInfoDTO
        """
        return ProjectInfoDTO(
            locale=locale_record["locale"],
            name=locale_record["name"] or "",
            description=locale_record["description"] or "",
            short_description=locale_record["short_description"] or "",
            instructions=locale_record["instructions"] or "",
            per_task_instructions=locale_record["per_task_instructions"] or "",
        )

    # Function to get DTOs for all locales of a project
    async def get_dto_for_all_locales(
        db: Database, project_id: int
    ) -> List[ProjectInfoDTO]:
        """
        Get DTOs for all locales associated with a project
        :param database: The database connection
        :param project_id: The project ID to filter locales
        :return: List of ProjectInfoDTO
        """
        query = """
        SELECT locale, name, description, short_description, instructions, per_task_instructions
        FROM project_info
        WHERE project_id = :project_id
        """
        locales = await db.fetch_all(query=query, values={"project_id": project_id})

        project_info_dtos = (
            [
                await ProjectInfo.get_project_info_dto(locale_record)
                for locale_record in locales
            ]
            if locales
            else []
        )

        return project_info_dtos
