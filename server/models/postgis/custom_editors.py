from server import db
from server.models.dtos.project_dto import CustomEditorDTO


class CustomEditor(db.Model):
    """ Model for user defined editors for a project """
    __tablename__ = "project_custom_editors"
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String)
    url = db.Column(db.String, nullable=False)
    enabled = db.Column(db.Boolean, nullable=False, default=False)

    @staticmethod
    def get_by_project_id(project_id: int):
        """ Get custom editor by it's project id """
        return CustomEditor.query.get(project_id)

    @classmethod
    def create_from_dto(cls, project_id: int, dto: CustomEditorDTO):
        """ Creates a new CustomEditor from dto, used in project edit """
        new_editor = cls()
        new_editor.project_id = project_id
        new_editor.update_editor(dto)
        return new_editor

    def update_editor(self, dto: CustomEditorDTO):
        """ Upates existing CustomEditor form DTO """
        self.name = dto.name
        self.description = dto.description
        self.url = dto.url
        self.enabled = dto.enabled

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()

    def as_dto(self) -> CustomEditorDTO:
        """ Returns the CustomEditor as a DTO """
        dto = CustomEditorDTO()
        dto.project_id = self.project_id
        dto.name = self.name
        dto.description = self.description
        dto.url = self.url
        dto.enabled = self.enabled

        return dto
