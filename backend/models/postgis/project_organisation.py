from databases import Database
from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint

from backend.db import Base
from backend.models.dtos.project_organisation_dto import ProjectOrganisationDTO
from backend.models.postgis.utils import timestamp


class ProjectOrganisation(Base):
    """Links a supporting organisation to a project.

    The lead organisation of a project stays on `projects.organisation_id`;
    this table only holds the additional organisations backing the project.
    """

    __tablename__ = "project_organisations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    organisation_id = Column(
        Integer,
        ForeignKey("organisations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime, nullable=False, default=timestamp)

    __table_args__ = (
        UniqueConstraint(
            "project_id", "organisation_id", name="uq_project_organisation"
        ),
    )

    @staticmethod
    async def get_by_id(project_organisation_id: int, db: Database):
        """Return the project-organisation link for the specified id, or None if not found"""
        query = """
            SELECT id, project_id, organisation_id, created_at
            FROM project_organisations
            WHERE id = :project_organisation_id
        """
        return await db.fetch_one(
            query, values={"project_organisation_id": project_organisation_id}
        )

    @staticmethod
    async def get_by_project_and_organisation(
        project_id: int, organisation_id: int, db: Database
    ):
        """Return the link between the given project and organisation, or None if not found"""
        query = """
            SELECT id, project_id, organisation_id, created_at
            FROM project_organisations
            WHERE project_id = :project_id
                AND organisation_id = :organisation_id
        """
        return await db.fetch_one(
            query,
            values={"project_id": project_id, "organisation_id": organisation_id},
        )

    async def create(self, db: Database) -> int:
        """
        Inserts the current object as a record in the database and returns its ID.
        """
        query = """
            INSERT INTO project_organisations (project_id, organisation_id, created_at)
            VALUES (:project_id, :organisation_id, :created_at)
            RETURNING id
        """
        values = {
            "project_id": self.project_id,
            "organisation_id": self.organisation_id,
            "created_at": self.created_at if self.created_at else timestamp(),
        }
        result = await db.fetch_one(query, values=values)
        return result["id"]

    async def delete(self, db: Database) -> None:
        """
        Deletes the current object from the database.
        """
        query = """
            DELETE FROM project_organisations
            WHERE id = :id
        """
        await db.execute(query, values={"id": self.id})

    def as_dto(self) -> ProjectOrganisationDTO:
        """Creates a Project-Organisation DTO"""
        return ProjectOrganisationDTO(
            id=self.id,
            project_id=self.project_id,
            organisation_id=self.organisation_id,
            created_at=self.created_at,
        )
