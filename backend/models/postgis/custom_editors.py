from databases import Database
from sqlalchemy import Column, ForeignKey, Integer, String, delete, update

from backend.db import Base, get_session
from backend.models.dtos.project_dto import CustomEditorDTO

session = get_session()


class CustomEditor(Base):
    """Model for user defined editors for a project"""

    __tablename__ = "project_custom_editors"
    project_id = Column(Integer, ForeignKey("projects.id"), primary_key=True)
    name = Column(String(50), nullable=False)
    description = Column(String)
    url = Column(String, nullable=False)

    def create(self):
        """Creates and saves the current model to the DB"""
        session.add(self)
        session.commit()

    def save(self):
        """Save changes to db"""
        session.commit()

    @staticmethod
    def get_by_project_id(project_id: int):
        """Get custom editor by it's project id"""
        return session.get(CustomEditor, project_id)

    @classmethod
    async def create_from_dto(cls, project_id: int, dto: CustomEditorDTO, db: Database):
        """Creates a new CustomEditor from dto, used in project edit"""
        new_editor = cls()
        new_editor.project_id = project_id
        new_editor = await new_editor.update_editor(dto, db)
        return new_editor

    async def update_editor(self, dto: CustomEditorDTO, db: Database):
        """Upates existing CustomEditor form DTO"""
        self.name = dto.name
        self.description = dto.description
        self.url = dto.url

        query = (
            update(CustomEditor.__table__)
            .where(CustomEditor.id == self.id)
            .values(name=self.name, description=self.description, url=self.url)
        )
        await db.execute(query)

    async def delete(self, db: Database):
        """Deletes the current model from the DB"""
        await db.execute(
            delete(CustomEditor.__table__).where(CustomEditor.id == self.id)
        )

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
