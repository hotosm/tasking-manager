from sqlalchemy import (
    Column,
    Integer,
    Text,
    Unicode,
    event
    )

from geoalchemy import *
from geoalchemy.utils import (
    to_wkt
    )

from geojson import loads

from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy.orm import (
    scoped_session,
    sessionmaker,
    )

from zope.sqlalchemy import ZopeTransactionExtension

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()

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
    geometry = GeometryColumn(Polygon(2, srid=4326))

    def __init__(self, title, geometry):
        self.title = title
        self.status = 2
        self.short_description = u''
        self.description = u''
        self.geometry = to_wkt(loads(geometry))

GeometryDDL(Job.__table__)
