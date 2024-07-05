from backend import db
from backend.models.postgis.utils import timestamp

from backend.models.dtos.project_partner_dto import ProjectPartnershipDTO


class ProjectPartnershipHistory(db.Model):
    __tablename__ = "project_partnerships_history"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    partnership_id = db.Column(
        db.Integer, db.ForeignKey("project_partnerships.id"), nullable=False, index=True
    )
    project_id = db.Column(
        db.Integer, db.ForeignKey("projects.id"), nullable=False, index=True
    )
    partner_id = db.Column(
        db.Integer, db.ForeignKey("partners.id"), nullable=False, index=True
    )

    started_on_old = db.Column(db.DateTime, default=timestamp)
    ended_on_old = db.Column(db.DateTime, default=timestamp)
    started_on_new = db.Column(db.DateTime, default=timestamp)
    ended_on_new = db.Column(db.DateTime, default=timestamp)

    def create(self):
        """Creates and saves the current model to the DB"""
        db.session.add(self)
        db.session.commit()

    def save(self):
        """Save changes to db"""
        db.session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        db.session.delete(self)
        db.session.commit()


class ProjectPartnership(db.Model):
    __tablename__ = "project_partnerships"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"))
    partner_id = db.Column(db.Integer, db.ForeignKey("partners.id"))
    started_on = db.Column(db.DateTime, default=timestamp, nullable=False)
    ended_on = db.Column(db.DateTime, default=timestamp, nullable=True)

    @staticmethod
    def get_by_id(partnership_id: int):
        """Return the user for the specified id, or None if not found"""
        return db.session.get(ProjectPartnership, partnership_id)

    def create(self):
        """Creates and saves the current model to the DB"""
        db.session.add(self)
        db.session.commit()
        return self.id

    def save(self):
        """Save changes to db"""
        db.session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        db.session.delete(self)
        db.session.commit()

    def as_dto(self) -> ProjectPartnershipDTO:
        """Creates a Partnership DTO"""
        partnership_dto = ProjectPartnershipDTO()
        partnership_dto.id = self.id
        partnership_dto.project_id = self.project_id
        partnership_dto.partner_id = self.partner_id
        partnership_dto.started_on = self.started_on
        partnership_dto.ended_on = self.ended_on
        return partnership_dto
