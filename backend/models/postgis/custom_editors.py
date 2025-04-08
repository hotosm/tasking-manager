from databases import Database
from sqlalchemy import Column, ForeignKey, Integer, String

from backend.db import Base
from backend.models.dtos.project_dto import CustomEditorDTO


class CustomEditor(Base):
    """Model for user defined editors for a project"""

    __tablename__ = "project_custom_editors"
    project_id = Column(Integer, ForeignKey("projects.id"), primary_key=True)
    name = Column(String(50), nullable=False)
    description = Column(String)
    url = Column(String, nullable=False)

    async def get_by_project_id(project_id: int, db: Database):
        """Retrieves a CustomEditor by project_id"""
        query = """
            SELECT * FROM project_custom_editors
            WHERE project_id = :project_id
        """
        values = {"project_id": project_id}
        row = await db.fetch_one(query, values=values)
        if row:
            return CustomEditor(**row)
        else:
            return None

    @staticmethod
    async def create_from_dto(project_id: int, dto: CustomEditorDTO, db: Database):
        """Creates a new CustomEditor from dto, used in project edit"""
        custom_editor_query = """
            INSERT INTO project_custom_editors (project_id, name, description, url)
            VALUES (:project_id, :name, :description, :url)
        """
        await db.execute(
            custom_editor_query,
            {
                "project_id": project_id,
                "name": dto.name,
                "description": dto.description,
                "url": dto.url,
            },
        )

    async def update_editor(project_id: int, dto: CustomEditorDTO, db: Database):
        """Updates existing CustomEditor form DTO using raw SQL"""
        query = """
        UPDATE project_custom_editors
        SET name = :name, description = :description, url = :url
        WHERE project_id = :project_id
        """

        await db.execute(
            query,
            values={
                "name": dto.name,
                "description": dto.description,
                "url": dto.url,
                "project_id": project_id,
            },
        )

    async def delete(project_id: int, db: Database):
        """Deletes the CustomEditor with the given project_id from the DB using raw SQL"""
        query = """
        DELETE FROM project_custom_editors
        WHERE project_id = :project_id
        """

        await db.execute(query, values={"project_id": project_id})

    def as_dto(self) -> CustomEditorDTO:
        """Returns the CustomEditor as a DTO"""
        dto = CustomEditorDTO()
        dto.project_id = self.project_id
        dto.name = self.name
        dto.description = self.description
        dto.url = self.url

        return dto

    def clone_to_project(self, project_id: int):
        new_editor = CustomEditor()
        new_editor.project_id = project_id
        new_editor.name = self.name
        new_editor.description = self.description
        new_editor.url = self.url
        return new_editor
