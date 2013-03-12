from sqlalchemy import (
    Column,
    Integer,
    Text,
    Unicode,
    ForeignKey,
    Boolean,
    )

from geoalchemy2 import (
    Geometry,
    shape,
    elements
    )
from geoalchemy2.functions import (
    ST_Transform,
    )

import geojson
import shapely

from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy.orm import (
    scoped_session,
    sessionmaker,
    relationship
    )

from .utils import (
    TileBuilder,
    get_tiles_in_geom,
    max
    )

from zope.sqlalchemy import ZopeTransactionExtension

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()

class Task(Base):
    __tablename__ = "tasks"
    x = Column(Integer, primary_key=True)
    y = Column(Integer, primary_key=True)
    zoom = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey('project.id'), primary_key=True, index=True)
    geometry = Column(Geometry('Polygon', srid=3857))

    def __init__(self, x, y, zoom):
        self.x = x
        self.y = y
        self.zoom = zoom
        self.geometry = elements.WKTElement(self.to_polygon().wkt, 3857)

    def to_polygon(self):
        # task size (in meters) at the required zoom level
        step = max/(2**(self.zoom - 1))
        tb = TileBuilder(step)
        return tb.create_square(self.x, self.y)

class Area(Base):
    __tablename__ = 'areas'
    id = Column(Integer, primary_key=True)
    geometry = Column(Geometry('Polygon', srid=4326))

    def __init__(self, geometry):
        geometry = geojson.loads(geometry, object_hook=geojson.GeoJSON.to_instance)
        geometry = shapely.geometry.asShape(geometry)
        geometry = shape.from_shape(geometry, 4326)
        self.geometry = geometry

# A project corresponds to a given mapping job to do on a given area
# Example 1: trace the major roads
# Example 2: trace the buildings
# Each has its own grid with its own task size.
class Project(Base):
    __tablename__ = 'project'
    id = Column(Integer, primary_key=True)
    name = Column(Unicode)
    short_description = Column(Unicode)
    # statuses are:
    # 0 - archived
    # 1 - published
    # 2 - draft
    # 3 - featured
    status = Column(Integer)
    description = Column(Unicode)
    short_description = Column(Unicode)
    area_id = Column(Integer, ForeignKey('areas.id'))
    area = relationship(Area)
    tasks = relationship(Task, backref='task', cascade="all, delete, delete-orphan")

    def __init__(self, name, area):
        self.name = name
        self.area = area
        self.status = 2
        self.short_description = u''
        self.description = u''

    # auto magically fills the area with tasks for the given zoom
    def auto_fill(self, zoom):
        self.zoom = zoom
        geom_3857 = DBSession.execute(ST_Transform(self.area.geometry, 3857)).scalar()
        geom_3857 = shape.to_shape(geom_3857)

        tasks = []
        for i in get_tiles_in_geom(geom_3857, zoom):
            tasks.append(Task(i[0], i[1], zoom))
        self.tasks = tasks

class User(Base):
    __tablename__ = "users"
    username = Column(Unicode, primary_key=True)
    admin = Column(Boolean)

    def __init__(self, username, admin=False):
        self.username = username
        self.admin = admin

    def is_admin(self):
        return self.admin == True
