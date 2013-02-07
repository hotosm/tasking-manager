from sqlalchemy import (
    Column,
    Integer,
    Text,
    Unicode,
    ForeignKey,
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

class Tile(Base):
    __tablename__ = "tiles"
    x = Column(Integer, primary_key=True)
    y = Column(Integer, primary_key=True)
    zoom = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey('jobs.id'), primary_key=True, index=True)
    geometry = Column(Geometry('Polygon', srid=3857))

    def __init__(self, x, y, zoom):
        self.x = x
        self.y = y
        self.zoom = zoom
        self.geometry = elements.WKTElement(self.to_polygon().wkt, 3857)

    def to_polygon(self):
        # tile size (in meters) at the required zoom level
        step = max/(2**(self.zoom - 1))
        tb = TileBuilder(step)
        return tb.create_square(self.x, self.y)

class Job(Base):
    __tablename__ = 'jobs'
    id = Column(Integer, primary_key=True)
    title = Column(Unicode)
    # statuses are:
    # 0 - archived
    # 1 - published
    # 2 - draft
    # 3 - featured
    status = Column(Integer)
    description = Column(Unicode)
    short_description = Column(Unicode)
    geometry = Column(Geometry('Polygon', srid=4326))
    tiles = relationship(Tile, backref='job', cascade="all, delete, delete-orphan")

    def __init__(self, title, geometry):
        self.title = title
        self.status = 2
        self.short_description = u''
        self.description = u''

        geometry = geojson.loads(geometry, object_hook=geojson.GeoJSON.to_instance)
        print type(geometry)
        geometry = shapely.geometry.asShape(geometry)
        geometry = shape.from_shape(geometry, 4326)
        self.geometry = geometry

        geom_3857 = DBSession.execute(ST_Transform(self.geometry, 3857)).scalar()

        geom_3857 = shape.to_shape(geom_3857)
        print geom_3857

        tiles = []
        for i in get_tiles_in_geom(geom_3857, 12):
            tiles.append(Tile(i[0], i[1], 12))
        self.tiles = tiles
