from backend import db
from backend.models.postgis.utils import timestamp


class ProjectPartnerHistory(db.Model):
    __tablename__ = "project_partnerships_history"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    partnership_id = db.Column(
        db.Integer, db.ForeignKey("project_partnerships.id"), nullable=False, index=True
    )
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

    partnership = db.relationship(
        "ProjectPartner", backref=db.backref("project_partnerships", cascade="all, delete-orphan")
    )
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
    __tablename__ = "project_partnerships"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("project.id"))
    partner_id = db.Column(db.Integer, db.ForeignKey("partner.id"))
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
