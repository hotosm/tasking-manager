from server import db
from geoalchemy2 import Geometry


# Priority areas aren't shared, however, this arch was taken from TM2 to ease data migration
project_priority_areas = db.Table(
    'project_priority_areas', db.metadata,
    db.Column('project_id', db.Integer, db.ForeignKey('projects.id')),
    db.Column('priority_area_id', db.Integer, db.ForeignKey('priority_areas.id'))
)


class PriorityArea(db.Model):
    """ Describes an individual priority area """
    __tablename__ = "priority_areas"

    id = db.Column(db.Integer, primary_key=True)
    geometry = db.Column(Geometry('POLYGON', srid=4326))
