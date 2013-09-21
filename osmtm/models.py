from sqlalchemy import (
    Column,
    Integer,
    Text,
    Unicode,
    ForeignKey,
    Boolean,
    DateTime,
    event,
    inspect,
    )

from geoalchemy2 import (
    Geometry,
    shape,
    elements
    )
from geoalchemy2.functions import (
    ST_Transform,
    ST_Centroid
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

import datetime

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()

from sqlalchemy_i18n import (
    Translatable,
    make_translatable,
    )
make_translatable()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(Unicode)
    admin = Column(Boolean)

    def __init__(self, id, username, admin=False):
        self.id = id
        self.username = username
        self.admin = admin

    def is_admin(self):
        return self.admin == True

class TaskHistory(Base):
    __tablename__ = "tasks_history"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey('tasks.id'))
    project_id = Column(Integer, ForeignKey('project.id'))
    old_state = Column(Integer)
    state = Column(Integer, default=0)
    prev_user_id = Column(Integer, ForeignKey('users.id'))
    prev_user = relationship(User, foreign_keys=[prev_user_id])
    user_id = Column(Integer, ForeignKey('users.id'))
    user = relationship(User, foreign_keys=[user_id])
    update = Column(DateTime)

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    x = Column(Integer)
    y = Column(Integer)
    zoom = Column(Integer)
    project_id = Column(Integer, ForeignKey('project.id'))
    geometry = Column(Geometry('Polygon', srid=4326))
    # possible states are:
    # 0 - ready
    # 1 - working
    # 2 - done
    # 3 - reviewed
    state = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey('users.id'))
    user = relationship(User)
    update = Column(DateTime)
    history = relationship(TaskHistory, cascade="all, delete, delete-orphan")

    def __init__(self, x, y, zoom, geometry=None):
        self.x = x
        self.y = y
        self.zoom = zoom
        if (geometry is None):
            geometry = self.to_polygon()
        self.geometry = ST_Transform(elements.WKTElement(geometry.wkt, 3857), 4326)

    def to_polygon(self):
        # task size (in meters) at the required zoom level
        step = max/(2**(self.zoom - 1))
        tb = TileBuilder(step)
        return tb.create_square(self.x, self.y)

@event.listens_for(Task, "before_update")
def before_update(mapper, connection, target):
    d = datetime.datetime.now()
    target.update = d

@event.listens_for(Task, "after_update")
def after_update(mapper, connection, target):
    project_table = Project.__table__
    project = target.project
    connection.execute(
            project_table.update().
             where(project_table.c.id==project.id).
             values(last_update=datetime.datetime.now())
    )

def get_old_value(attribute_state):
    history = attribute_state.history
    return history.deleted[0] if history.deleted else None

@event.listens_for(DBSession, "after_flush")
def after_flush(session, flush_context):
    for obj in session.new.union(session.dirty):
        if isinstance(obj, Task):
            taskhistory = TaskHistory()
            taskhistory.task_id = obj.id
            taskhistory.project_id = obj.project_id
            taskhistory.state = obj.state
            taskhistory.update = obj.update
            taskhistory.user = obj.user
            attr_state = inspect(obj).attrs
            taskhistory.old_state = get_old_value(attr_state.get("state"))
            taskhistory.prev_user = get_old_value(attr_state.get("user"))
            session.add(taskhistory)

@event.listens_for(DBSession, "before_flush")
def before_flush(session, flush_context, instances):
    for obj in session.dirty:
        if isinstance(obj, Task):
            obj.project.last_update = datetime.datetime.now()

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
class Project(Base, Translatable):
    __tablename__ = 'project'
    id = Column(Integer, primary_key=True)
    # statuses are:
    # 0 - archived
    # 1 - published
    # 2 - draft
    # 3 - featured
    status = Column(Integer)
    __translated_columns__ = [
        Column('name', Unicode, default=u''),
        Column('description', Unicode, default=u''),
        Column('short_description', Unicode, default=u''),
    ]
    area_id = Column(Integer, ForeignKey('areas.id'))
    created = Column(DateTime)
    author_id = Column(Integer, ForeignKey('users.id'))
    author = relationship(User)
    last_update = Column(DateTime)
    area = relationship(Area)
    tasks = relationship(Task, backref='project', cascade="all, delete, delete-orphan")

    def get_locale(self):
        pass

    def __init__(self, name, area, user=None):
        self.name = name
        self.area = area
        self.status = 2
        self.created = datetime.datetime.now()
        self.last_update = datetime.datetime.now()
        self.author = user

    # auto magically fills the area with tasks for the given zoom
    def auto_fill(self, zoom):
        self.zoom = zoom
        geom_3857 = DBSession.execute(ST_Transform(self.area.geometry, 3857)).scalar()
        geom_3857 = shape.to_shape(geom_3857)

        tasks = []
        for i in get_tiles_in_geom(geom_3857, zoom):
            tasks.append(Task(i[0], i[1], zoom, i[2]))
        self.tasks = tasks

    def as_dict(self, locale=None):
        if locale:
            self.get_locale = lambda: locale

        geometry_as_shape = shape.to_shape(self.area.geometry)
        centroid = geometry_as_shape.centroid

        return {
            'id': self.id,
            'name': self.name,
            'short_description': self.short_description,
            'created': self.created,
            'last_update': self.last_update,
            'status': self.status,
            'author': self.author.username if self.author is not None else None,
            'done': self.get_done(),
            'centroid': [centroid.x, centroid.y]
        }

    def get_done(self):
        total = 0
        done = 0
        for task in self.tasks:
            total += 1
            if task.state >= 2:
                done += 1
            # FIXME it would be nice to get percent done based on area instead
            # the following works but is slow
            #area = DBSession.execute(ST_Area(task.geometry)).scalar()
            #total = total + area
            #if task.state >= 2:
                #done = done + area
        return round(done * 100 / total) / 100

from json import (
    JSONEncoder,
    dumps as _dumps,
)
import functools

class ExtendedJSONEncoder(JSONEncoder):
    def default(self, obj):

        if isinstance(obj, (datetime.date, datetime.datetime)):
            return obj.isoformat(' ')

        return JSONEncoder.default(self, obj)

dumps = functools.partial(_dumps, cls=ExtendedJSONEncoder)
