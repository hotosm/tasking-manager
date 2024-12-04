from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
)

from backend.db import Base
from backend.models.dtos.project_dto import ProjectTaskAnnotationsDTO
from backend.models.dtos.task_annotation_dto import TaskAnnotationDTO
from backend.models.postgis.utils import timestamp


class TaskAnnotation(Base):
    """Describes Task annotaions like derived ML attributes"""

    __tablename__ = "task_annotations"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), index=True)
    task_id = Column(Integer, nullable=False)
    annotation_type = Column(String, nullable=False)
    annotation_source = Column(String)
    annotation_markdown = Column(String)
    updated_timestamp = Column(DateTime, nullable=False, default=timestamp)
    properties = Column(JSON, nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(
            [task_id, project_id],
            ["tasks.id", "tasks.project_id"],
            name="fk_task_annotations",
        ),
        Index("idx_task_annotations_composite", "task_id", "project_id"),
        {},
    )

    def __init__(
        self,
        task_id,
        project_id,
        annotation_type,
        properties,
        annotation_source=None,
        annotation_markdown=None,
    ):
        self.task_id = task_id
        self.project_id = project_id
        self.annotation_type = annotation_type
        self.annotation_source = annotation_source
        self.annotation_markdown = annotation_markdown
        self.properties = properties

    @staticmethod
    def get_task_annotation(task_id, project_id, annotation_type):
        """Get annotations for a task with supplied type"""
        return (
            session.query(TaskAnnotation)
            .filter_by(
                project_id=project_id, task_id=task_id, annotation_type=annotation_type
            )
            .one_or_none()
        )

    def get_dto(self):
        task_annotation_dto = TaskAnnotationDTO()
        task_annotation_dto.task_id = self.task_id
        task_annotation_dto.properties = self.properties
        task_annotation_dto.annotation_type = self.annotation_type
        task_annotation_dto.annotation_source = self.annotation_source
        task_annotation_dto.annotation_markdown = self.annotation_markdown
        return task_annotation_dto

    @staticmethod
    def get_task_annotations_by_project_id_type(project_id, annotation_type):
        """Get annotatiols for a project with the supplied type"""
        project_task_annotations = (
            session.query(TaskAnnotation)
            .filter_by(project_id=project_id, annotation_type=annotation_type)
            .all()
        )

        project_task_annotations_dto = ProjectTaskAnnotationsDTO()
        project_task_annotations_dto.project_id = project_id
        if project_task_annotations:
            project_task_annotations_dto = ProjectTaskAnnotationsDTO()
            project_task_annotations_dto.project_id = project_id
            for row in project_task_annotations:
                task_annotation_dto = TaskAnnotationDTO()
                task_annotation_dto.task_id = row.task_id
                task_annotation_dto.properties = row.properties
                task_annotation_dto.annotation_type = row.annotation_type
                task_annotation_dto.annotation_source = row.annotation_source
                task_annotation_dto.annotation_markdown = row.annotation_markdown
                project_task_annotations_dto.tasks.append(task_annotation_dto)

        return project_task_annotations_dto

    @staticmethod
    def get_task_annotations_by_project_id(project_id):
        """Get annotatiols for a project with the supplied type"""
        project_task_annotations = (
            session.query(TaskAnnotation).filter_by(project_id=project_id).all()
        )

        project_task_annotations_dto = ProjectTaskAnnotationsDTO()
        project_task_annotations_dto.project_id = project_id
        if project_task_annotations:
            for row in project_task_annotations:
                task_annotation_dto = TaskAnnotationDTO()
                task_annotation_dto.task_id = row.task_id
                task_annotation_dto.properties = row.properties
                task_annotation_dto.annotation_type = row.annotation_type
                task_annotation_dto.annotation_source = row.annotation_source
                project_task_annotations_dto.tasks.append(task_annotation_dto)

        return project_task_annotations_dto
