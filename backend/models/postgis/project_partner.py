from backend import db
from backend.models.postgis.utils import timestamp
from backend.models.postgis.project import Project
from backend.models.postgis.partner import Partner
from typing import List


class ProjectPartnerHistory(db.Model):
    __tablename__ = "project_partners_history"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_id = db.Column(
        db.Integer, db.ForeignKey("project.id"), nullable=False, index=True
    )
    partner_id = db.Column(
        db.Integer, db.ForeignKey("partner.id"), nullable=False, index=True
    )

    started_on_old = db.Column(db.DateTime, default=timestamp)
    ended_on_old = db.Column(db.DateTime, default=timestamp)
    started_on_new = db.Column(db.DateTime, default=timestamp)
    ended_on_new = db.Column(db.DateTime, default=timestamp)

    project = db.relationship(
        "Project", backref=db.backref("projects", cascade="all, delete-orphan")
    )
    partner = db.relationship(
        "Partner", backref=db.backref("partners", cascade="all, delete-orphan")
    )

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


class ProjectPartner(db.Model):
    __tablename__ = "project_partners"

    project_id = db.Column(
        db.Integer, db.ForeignKey("project.id"), primary_key=True, index=True
    )
    partner_id = db.Column(
        db.Integer, db.ForeignKey("partner.id"), primary_key=True, index=True
    )
    started_on = db.Column(db.DateTime, default=timestamp, nullable=False)

    project = db.relationship(
        "Project", backref=db.backref("projects", cascade="all, delete-orphan")
    )
    partner = db.relationship(
        "Partner", backref=db.backref("partners", cascade="all, delete-orphan")
    )

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

    @staticmethod
    def get_partners(project_id: int) -> List[Project]:
        """Get the partners associated with a project"""
        return ProjectPartner.query.filter_by(project_id=project_id).all()

    @staticmethod
    def get_projects(partner_id: int) -> List[Partner]:
        """Get the projects associated with a partner"""
        return ProjectPartner.query.filter_by(partner_id=partner_id).all()

    @staticmethod
    def start_partner(partner_id: int, project_id: int) -> bool:
        """Begin a partnership for a project"""
        row = ProjectPartner.query.filter_by(
            project_id=project_id, partner_id=partner_id
        ).one_or_none()

        if row is not None:
            return False

        started_on = timestamp()
        partnership_new = {
            "project_id": project_id,
            "partner_id": partner_id,
            "started_on": started_on,
        }

        ProjectPartner.insert.values(partnership_new)
        ProjectPartnerHistory.insert.values(
            {
                "project_id": project_id,
                "partner_id": partner_id,
                "action": "START",
                "action_date": started_on,
                "started_on_new": started_on,
            }
        )
        return True

    @staticmethod
    def end_partner(partner_id: int, project_id: int) -> bool:
        """End a project partnership"""
        row = ProjectPartner.query.filter_by(
            project_id=project_id, partner_id=partner_id
        ).one_or_none()

        if row is None:
            return False

        row.delete()
        ended_on = timestamp()

        ProjectPartnerHistory.insert.values(
            {
                "project_id": project_id,
                "partner_id": partner_id,
                "action": "END",
                "action_date": ended_on,
                "ended_on_new": ended_on,
            }
        )
        return True
