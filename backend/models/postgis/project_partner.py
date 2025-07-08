from datetime import datetime, timezone

from databases import Database
from sqlalchemy import Column, DateTime, ForeignKey, Integer

from backend.db import Base
from backend.models.dtos.project_partner_dto import (
    ProjectPartnerAction,
    ProjectPartnershipDTO,
)
from backend.models.postgis.utils import timestamp


class ProjectPartnershipHistory(Base):
    """Logs changes to the Project-Partnership links"""

    __tablename__ = "project_partnerships_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    partnership_id = Column(
        Integer,
        ForeignKey("project_partnerships.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    project_id = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    partner_id = Column(
        Integer,
        ForeignKey("partners.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    action = Column(Integer, nullable=False, default=ProjectPartnerAction.CREATE.value)
    action_date = Column(DateTime, nullable=False, default=timestamp)

    started_on_old = Column(DateTime, nullable=True)
    ended_on_old = Column(DateTime, nullable=True)
    started_on_new = Column(DateTime, nullable=True)
    ended_on_new = Column(DateTime, nullable=True)

    def convert_to_utc_naive(self, dt: datetime) -> datetime:
        """Converts a timezone-aware datetime to a UTC timezone-naive datetime."""
        if dt.tzinfo is not None:
            # return dt.astimezone(datetime.timezone.utc).replace(tzinfo=None)
            return dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt

    async def create(self, db: Database) -> int:
        """
        Inserts the current object as a record in the database and returns its ID.
        """

        if self.started_on_old:
            self.started_on_old = self.convert_to_utc_naive(self.started_on_old)
        if self.ended_on_old:
            self.ended_on_old = self.convert_to_utc_naive(self.ended_on_old)
        if self.started_on_new:
            self.started_on_new = self.convert_to_utc_naive(self.started_on_new)
        if self.ended_on_new:
            self.ended_on_new = self.convert_to_utc_naive(self.ended_on_new)

        query = """
            INSERT INTO project_partnerships_history (
                partnership_id,
                project_id,
                partner_id,
                action,
                action_date,
                started_on_old,
                ended_on_old,
                started_on_new,
                ended_on_new
            )
            VALUES (
                :partnership_id,
                :project_id,
                :partner_id,
                :action,
                :action_date,
                :started_on_old,
                :ended_on_old,
                :started_on_new,
                :ended_on_new
            )
            RETURNING id
        """
        values = {
            "partnership_id": self.partnership_id,
            "project_id": self.project_id,
            "partner_id": self.partner_id,
            "action": self.action if self.action else ProjectPartnerAction.CREATE.value,
            "action_date": timestamp(),
            "started_on_old": self.started_on_old if self.started_on_old else None,
            "ended_on_old": self.ended_on_old if self.ended_on_old else None,
            "started_on_new": self.started_on_new if self.started_on_new else None,
            "ended_on_new": self.ended_on_new if self.ended_on_new else None,
        }
        result = await db.fetch_one(query, values=values)
        return result["id"]


class ProjectPartnership(Base):
    """Describes the relationship between a Project and a Partner"""

    __tablename__ = "project_partnerships"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    partner_id = Column(
        Integer, ForeignKey("partners.id", ondelete="CASCADE"), nullable=False
    )
    started_on = Column(DateTime, nullable=False, default=timestamp)
    ended_on = Column(DateTime, nullable=True)

    def convert_to_utc_naive(self, dt: datetime) -> datetime:
        """Converts a timezone-aware datetime to a UTC timezone-naive datetime."""
        if dt.tzinfo is not None:
            return dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt

    @staticmethod
    async def get_by_id(partnership_id: int, db: Database):
        """Return the user for the specified id, or None if not found"""
        query = """
            SELECT *
            FROM project_partnerships
            WHERE id = :partnership_id
        """
        result = await db.fetch_one(query, values={"partnership_id": partnership_id})
        return result if result else None

    async def create(self, db: Database) -> int:
        """
        Inserts the current object as a record in the database and returns its ID.
        """

        self.started_on = self.convert_to_utc_naive(self.started_on)
        self.ended_on = (
            self.convert_to_utc_naive(self.ended_on) if self.ended_on else None
        )

        query = """
            INSERT INTO project_partnerships (project_id, partner_id, started_on, ended_on)
            VALUES (:project_id, :partner_id, :started_on, :ended_on)
            RETURNING id
        """
        values = {
            "project_id": self.project_id,
            "partner_id": self.partner_id,
            "started_on": self.started_on,
            "ended_on": self.ended_on if self.ended_on else None,
        }
        result = await db.fetch_one(query, values=values)
        return result["id"]

    async def save(self, db: Database) -> None:
        """
        Updates the current object in the database.
        """
        self.started_on = self.convert_to_utc_naive(self.started_on)
        self.ended_on = (
            self.convert_to_utc_naive(self.ended_on) if self.ended_on else None
        )

        query = """
            UPDATE project_partnerships
            SET
                project_id = :project_id,
                partner_id = :partner_id,
                started_on = :started_on,
                ended_on = :ended_on
            WHERE id = :id
        """
        values = {
            "id": self.id,
            "project_id": self.project_id,
            "partner_id": self.partner_id,
            "started_on": self.started_on,
            "ended_on": self.ended_on if self.ended_on else None,
        }
        await db.execute(query, values=values)

    async def delete(self, db: Database) -> None:
        """
        Deletes the current object from the database.
        """
        query = """
            DELETE FROM project_partnerships
            WHERE id = :id
        """
        await db.execute(query, values={"id": self.id})

    def as_dto(self) -> ProjectPartnershipDTO:
        """Creates a Partnership DTO"""
        partnership_dto = ProjectPartnershipDTO()
        partnership_dto.id = self.id
        partnership_dto.project_id = self.project_id
        partnership_dto.partner_id = self.partner_id
        partnership_dto.started_on = self.started_on
        partnership_dto.ended_on = self.ended_on
        return partnership_dto
