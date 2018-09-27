from server import db
from server.models.dtos.project_dto import ProjectFilesDTO, ProjectFileDTO
from server.models.postgis.utils import NotFound


class ProjectFiles(db.Model):
    """ Contains project files to load into JOSM """
    __tablename__ = 'project_files'

    id = db.Column(db.BigInteger, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    path = db.Column(db.String, nullable=False, unique=True)
    file_name = db.Column(db.String, nullable=False)

    def create(self):
        """ Creates and saves the current model to the DB """
        db.session.add(self)
        db.session.commit()

    @classmethod
    def create_from_dto(cls, dto: ProjectFileDTO):
        """ Creates new ProjectFiles class """
        new_file = cls()
        new_file.id = dto.id
        new_file.path = dto.path
        new_file.project_id = dto.project_id
        new_file.file_name = dto.file_name
        return new_file

    def as_dto(self) -> ProjectFileDTO:
        """ Casts project file object to DTO """
        dto = ProjectFileDTO()
        dto.path = self.path
        dto.file_name = self.file_name
        dto.id = self.id
        dto.project_id = self.project_id

        return dto

    @staticmethod
    def get_all_files(project_id: int) -> ProjectFilesDTO:
        """ Gets all files for a project """
        files = ProjectFiles.query.filter(ProjectFiles.project_id == project_id).all()

        if len(files) == 0:
            raise NotFound

        project_files_dto = ProjectFilesDTO()
        for f in files:
            project_files_dto.project_files.append(f.as_dto())

        return project_files_dto

    @staticmethod
    def get_file(project_id: int, file_id: int) -> ProjectFileDTO:
        """ Get a single project file """
        file = ProjectFiles.query.filter(ProjectFiles.project_id == project_id, ProjectFiles.id == file_id).one_or_none()
        dto = ProjectFileDTO()
        dto.id = file.id
        dto.path = file.path
        dto.file_name = file.file_name
        dto.project_id = file.project_id
        print(dto)
        return dto

    def delete(self):
        """ Deletes the current model form the DB """
        db.session.delete(self)
        db.session.commit()
