from databases import Database
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
    async def get_task_annotation(task_id, project_id, annotation_type, db: Database):
        """Get annotations for a task with the supplied type."""
        query = """
            SELECT * FROM task_annotations
            WHERE task_id = :task_id AND project_id = :project_id AND annotation_type = :annotation_type
        """
        return await db.fetch_one(
            query,
            values={
                "task_id": task_id,
                "project_id": project_id,
                "annotation_type": annotation_type,
            },
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
    async def get_task_annotations_by_project_id_type(
        project_id: int, annotation_type: str, db: Database
    ) -> ProjectTaskAnnotationsDTO:
        """Get annotations for a project with the supplied type"""
        query = """
        SELECT
            task_id,
            properties,
            annotation_type,
            annotation_source,
            annotation_markdown
        FROM
            task_annotations
        WHERE
            project_id = :project_id
            AND annotation_type = :annotation_type
        """

        results = await db.fetch_all(
            query=query,
            values={"project_id": project_id, "annotation_type": annotation_type},
        )

        project_task_annotations_dto = ProjectTaskAnnotationsDTO(project_id=project_id)

        for row in results:
            task_annotation_dto = TaskAnnotationDTO(
                task_id=row["task_id"],
                properties=row["properties"],
                annotation_type=row["annotation_type"],
                annotation_source=row["annotation_source"],
                annotation_markdown=row["annotation_markdown"],
            )
            project_task_annotations_dto.tasks.append(task_annotation_dto)

        return project_task_annotations_dto

    @staticmethod
    async def get_task_annotations_by_project_id(
        project_id: int, db: Database
    ) -> ProjectTaskAnnotationsDTO:
        """Get all annotations for a project"""
        query = """
        SELECT
            task_id,
            properties,
            annotation_type,
            annotation_source,
            annotation_markdown
        FROM
            task_annotations
        WHERE
            project_id = :project_id
        """

        results = await db.fetch_all(query=query, values={"project_id": project_id})

        project_task_annotations_dto = ProjectTaskAnnotationsDTO(project_id=project_id)

        for row in results:
            task_annotation_dto = TaskAnnotationDTO(
                task_id=row["task_id"],
                properties=row["properties"],
                annotation_type=row["annotation_type"],
                annotation_source=row["annotation_source"],
                annotation_markdown=row.get("annotation_markdown"),
            )
            project_task_annotations_dto.tasks.append(task_annotation_dto)

        return project_task_annotations_dto
