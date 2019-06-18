from server import db
from server.models.postgis.Project_Model import Project
from server.models.postgis.Organisation_Model import Organisation
from server.models.postgis.user import User

campaign_projects = db.Table(
    'campaign_projects', db.metadata,
    db.Column('campaign_id', db.Integer, db.ForeignKey('campaign.id'), nullable=False),
    db.Column('project_id', db.Integer, db.ForeignKey('project.id'), nullable=False)
)

campaign_organisations = db.Table(
    'campaign_organisations', db.metadata,
    db.Column('campaign_id', db.Integer,  db.ForeignKey('campaign.id'), nullable=False),
    db.Column('organisation_id', db.Integer, db.ForeignKey('organisation.id'), nullable=False)
)

campaign_users = db.Table(
    'campaign_users', db.metadata,
    db.Column('campaign_id', db.Integer,  db.ForeignKey('campaign.id'), nullable=False),
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), nullable=False)
)

class Campaign(db.Model):
    """ Describes an Campaign"""
    __tablename__ = 'campaign'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    logo = db.Column(db.String)
    url = db.Column(db.String)
    description = db.Column(db.String)
    
    projects = db.relationship(
        Project,
        secondary=campaign_projects,
        backref='campaign' 
    )

    organisation = db.relationship(
        Organisation,
        secondary=campaign_organisations,
        backref='campaign'
    )

    user_campaign = db.relationship(
        User,
        secondary=campaign_users,
        backref='campaign'
    )



