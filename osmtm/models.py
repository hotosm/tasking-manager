from sqlalchemy import (
    Table,
    Column,
    Integer,
    Unicode,
    ForeignKey,
    ForeignKeyConstraint,
    PrimaryKeyConstraint,
    Boolean,
    DateTime,
    CheckConstraint,
    Index,
    event,
    and_
)

from sqlalchemy.sql.expression import (
    func,
    select,
)

from geoalchemy2 import (
    Geometry,
    shape,
)
from geoalchemy2.functions import (
    ST_Area,
    ST_Transform,
    ST_Centroid,
    GenericFunction
)

from geojson import (
    Feature
)

from shapely.geometry import (
    MultiPolygon
)


class ST_Multi(GenericFunction):
    name = 'ST_Multi'
    type = Geometry


class ST_Collect(GenericFunction):
    name = 'ST_Collect'
    type = Geometry


class ST_Union(GenericFunction):
    name = 'ST_Union'
    type = Geometry


class ST_Buffer(GenericFunction):
    name = 'ST_Buffer'
    type = Geometry


class ST_SetSRID(GenericFunction):
    name = 'ST_SetSRID'
    type = Geometry

from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy.orm import (
    scoped_session,
    sessionmaker,
    relationship
)

from .utils import (
    TileBuilder,
    get_tiles_in_geom,
    max,
    parse_geojson,
)

from zope.sqlalchemy import ZopeTransactionExtension

import datetime

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()

from sqlalchemy_i18n import (
    Translatable,
    make_translatable,
    translation_base,
)
make_translatable()

users_licenses_table = Table('users_licenses', Base.metadata,
                             Column('user', Integer, ForeignKey('users.id')),
                             Column('license', Integer,
                                    ForeignKey('licenses.id')))


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(Unicode)
    admin = Column(Boolean)

    accepted_licenses = relationship("License", secondary=users_licenses_table)
    private_projects = relationship("Project",
                                    secondary="project_allowed_users")

    def __init__(self, id, username, admin=False):
        self.id = id
        self.username = username
        self.admin = admin

    def is_admin(self):
        return self.admin is True

    def as_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "admin": self.admin
        }

# task states
READY = 0
INVALIDATED = 1
DONE = 2
VALIDATED = 3
REMOVED = -1


class TaskState(Base):
    __tablename__ = "task_state"
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer)
    project_id = Column(Integer)
    state_ready = READY
    state_done = DONE
    state_validated = VALIDATED
    state_invalidated = INVALIDATED
    state_removed = REMOVED
    state = Column(Integer)
    user_id = Column(Integer, ForeignKey('users.id'))
    user = relationship(User)
    date = Column(DateTime)

    __table_args__ = (ForeignKeyConstraint([task_id, project_id],
                                           ['task.id', 'task.project_id']),
                      Index('task_state_task_project_index',
                            'task_id',
                            'project_id'),
                      Index('task_state_date', date.desc()),
                      {})

    def __init__(self, user=None, state=None):
        self.user = user
        self.state = state if state is not None else TaskState.state_ready
        self.date = datetime.datetime.utcnow()


class TaskLock(Base):
    __tablename__ = "task_lock"
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer)
    project_id = Column(Integer)
    lock = Column(Boolean)
    user_id = Column(Integer, ForeignKey('users.id'))
    user = relationship(User)
    date = Column(DateTime)

    __table_args__ = (ForeignKeyConstraint([task_id, project_id],
                                           ['task.id', 'task.project_id']),
                      Index('task_lock_task_project_index',
                            'task_id',
                            'project_id'),
                      Index('task_lock_date', date.desc()),
                      {})

    def __init__(self, user=None, lock=False):
        self.user = user
        self.lock = lock
        self.date = datetime.datetime.utcnow()


def task_id_factory(context):
    project_id = context.compiled_parameters[0]['project_id']

    sql = """
        SELECT MAX(id)
        FROM task
        WHERE project_id='%d'""" % (project_id, )

    result = context.connection.execute(sql).fetchone()[0]
    if result > 0:
        return result + 1
    else:
        return 1


class Task(Base):
    __tablename__ = "task"
    id = Column(Integer, default=task_id_factory)
    x = Column(Integer)
    y = Column(Integer)
    zoom = Column(Integer)
    project_id = Column(Integer, ForeignKey('project.id'), index=True)
    geometry = Column(Geometry('MultiPolygon', srid=4326))
    date = Column(DateTime)

    cur_lock = relationship(
        TaskLock,
        primaryjoin=lambda: and_(
            Task.id == TaskLock.task_id,
            Task.project_id == TaskLock.project_id,
            TaskLock.date == select(
                [func.max(TaskLock.date)]
            )
            .where(and_(TaskLock.task_id == Task.id,
                        TaskLock.project_id == Task.project_id))
            .correlate(Task.__table__)
        ),
        uselist=False
    )

    cur_state = relationship(
        TaskState,
        primaryjoin=lambda: and_(
            Task.id == TaskState.task_id,
            Task.project_id == TaskState.project_id,
            TaskState.date == select(
                [func.max(TaskState.date)]
            )
            .where(and_(TaskState.task_id == Task.id,
                        TaskState.project_id == Task.project_id))
            .correlate(Task.__table__)
        ),
        uselist=False
    )

    locks = relationship(
        TaskLock,
        order_by="desc(TaskLock.date)",
        cascade="all, delete, delete-orphan",
        backref="task")

    states = relationship(
        TaskState,
        order_by="desc(TaskState.date)",
        cascade="all, delete, delete-orphan",
        backref="task")

    __table_args__ = (PrimaryKeyConstraint('project_id', 'id'), {})

    def __init__(self, x, y, zoom, geometry=None):
        self.x = x
        self.y = y
        self.zoom = zoom
        if geometry is None:
            geometry = self.to_polygon()
            geometry = ST_Transform(shape.from_shape(geometry, 3857), 4326)

        self.geometry = geometry
        self.date = datetime.datetime.utcnow()

        self.states.append(TaskState())
        self.locks.append(TaskLock())

    def to_polygon(self):
        # task size (in meters) at the required zoom level
        step = max / (2 ** (self.zoom - 1))
        tb = TileBuilder(step)
        return tb.create_square(self.x, self.y)

    def to_feature(self):
        return Feature(
            geometry=shape.to_shape(self.geometry),
            id=self.id,
            properties={
                'state': self.cur_state.state if self.cur_state else 0,
                'locked': self.cur_lock and self.cur_lock.lock
            }
        )

    def add_comment(self, comment, user):
        print "############## TODO"

    def add_free_comment(self, comment, user):
        print "################ TODO"


@event.listens_for(Task, "before_update")
def before_update(mapper, connection, target):
    d = datetime.datetime.utcnow()
    target.update = d


class TaskComment(Base):
    __tablename__ = "task_comment"
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer)
    project_id = Column(Integer)

    comment = Column(Unicode)
    date = Column(DateTime)
    author_id = Column(Integer, ForeignKey('users.id'))
    author = relationship(User)

    __table_args__ = (ForeignKeyConstraint([task_id, project_id],
                                           ['task.id', 'task.project_id']),
                      {})

    def __init__(self, comment, author):
        self.comment = comment
        self.author = author
        self.date = datetime.datetime.utcnow()


@event.listens_for(DBSession, "before_flush")
def before_flush(session, flush_context, instances):
    for obj in session.dirty:
        if isinstance(obj, Task):
            obj.project.last_update = datetime.datetime.utcnow()


class Area(Base):
    __tablename__ = 'areas'
    id = Column(Integer, primary_key=True)
    geometry = Column(Geometry('MultiPolygon', srid=4326))
    centroid = Column(Geometry('Point', srid=4326))

    def __init__(self, geometry):
        self.geometry = ST_SetSRID(ST_Multi(geometry), 4326)


@event.listens_for(Area, "after_insert")
def area_after_insert(mapper, connection, target):
    area_table = Area.__table__
    connection.execute(
        area_table.update().
        where(area_table.c.id == target.id).
        values(centroid=ST_Centroid(target.geometry))
    )

project_allowed_users = Table(
    'project_allowed_users',
    Base.metadata,
    Column('project_id', Integer, ForeignKey('project.id')),
    Column('user_id', Integer, ForeignKey('users.id'))
)


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

    locale = 'en'

    area_id = Column(Integer, ForeignKey('areas.id'))
    created = Column(DateTime, default=datetime.datetime.utcnow)
    author_id = Column(Integer, ForeignKey('users.id'))
    author = relationship(User)
    last_update = Column(DateTime, default=datetime.datetime.utcnow)
    area = relationship(Area)
    tasks = relationship(Task, backref='project',
                         cascade="all, delete, delete-orphan")
    license_id = Column(Integer, ForeignKey('licenses.id'))

    zoom = Column(Integer)  # is not None when project is auto-filled (grid)
    imagery = Column(Unicode)

    # priorities are:
    # 0 - Urgent
    # 1 - High
    # 2 - Medium
    # 3 - Low
    priority = Column(Integer, default=2)

    # percentage of done tasks
    done = Column(Integer, default=0)
    # percentage of validated tasks
    validated = Column(Integer, default=0)

    __table_args__ = (CheckConstraint(priority.in_(range(0, 4))), )

    entities_to_map = Column(Unicode)
    changeset_comment = Column(Unicode)

    private = Column(Boolean, default=False)
    allowed_users = relationship(User,
                                 secondary=project_allowed_users)

    josm_preset = Column(Unicode)

    def __init__(self, name, user=None):
        self.name = name
        self.status = 2
        self.author = user

    # auto magically fills the area with tasks for the given zoom
    def auto_fill(self, zoom):
        self.zoom = zoom
        geom_3857 = DBSession.execute(ST_Transform(self.area.geometry, 3857)) \
                             .scalar()
        geom_3857 = shape.to_shape(geom_3857)

        tasks = []
        for i in get_tiles_in_geom(geom_3857, zoom):
            geometry = ST_Transform(shape.from_shape(i[2], 3857), 4326)
            tasks.append(Task(i[0], i[1], zoom, geometry))
        self.tasks = tasks
        self.zoom = zoom

    def import_from_geojson(self, input):

        polygons = parse_geojson(input)

        tasks = []
        for polygon in polygons:
            multi = MultiPolygon([polygon])
            tasks.append(Task(None, None, None, 'SRID=4326;%s' % multi.wkt))

        self.tasks = tasks

        DBSession.add(self)
        DBSession.flush()

        bounds = DBSession.query(ST_Union(ST_Buffer(Task.geometry, 0.01))) \
            .filter(Task.project_id == self.id).one()
        self.area = Area(bounds[0])

        return len(tasks)

    def as_dict(self, locale=None):
        if locale:
            self.locale = locale

        centroid = self.area.centroid

        return {
            'id': self.id,
            'name': self.name,
            'short_description': self.short_description,
            'created': self.created,
            'last_update': self.last_update,
            'status': self.status,
            'author': self.author.username if self.author is not None else '',
            'done': self.get_done(),
            'centroid': [centroid.x, centroid.y],
            'priority': self.priority
        }

    def get_done(self):
        total = DBSession.query(func.sum(ST_Area(Task.geometry))) \
            .filter(Task.project_id == self.id) \
            .filter(Task.state != TaskState.state_removed) \
            .scalar()

        done = DBSession.query(func.sum(ST_Area(Task.geometry))) \
            .filter(and_(Task.project_id == self.id,
                         Task.state == TaskState.state_done)) \
            .scalar()

        if not done:
            done = 0

        return round(done * 100 / total) if total != 0 else 0

    def get_validated(self):
        total = DBSession.query(func.sum(ST_Area(Task.geometry))) \
            .filter(Task.project_id == self.id) \
            .filter(Task.state != TaskState.state_removed) \
            .scalar()

        validated = DBSession.query(func.sum(ST_Area(Task.geometry))) \
            .filter(and_(Task.project_id == self.id,
                         Task.state == TaskState.state_validated)) \
            .scalar()

        if not validated:
            validated = 0

        return round(validated * 100 / total) if total != 0 else 0

# the time delta after which the task is unlocked (in seconds)
EXPIRATION_DELTA = datetime.timedelta(seconds=2 * 60 * 60)


@event.listens_for(Project, "after_insert")
def project_after_insert(mapper, connection, target):
    project_table = Project.__table__
    connection.execute(
        project_table.update().
        where(project_table.c.id == target.id).
        values(changeset_comment=u'#hotosm-task-%d' % target.id)
    )


class ProjectTranslation(translation_base(Project)):
    __tablename__ = 'project_translation'

    name = Column(Unicode(255), default=u'')
    description = Column(Unicode, default=u'')
    short_description = Column(Unicode, default=u'')
    instructions = Column(Unicode, default=u'')
    per_task_instructions = Column(Unicode, default=u'')


class License(Base):
    __tablename__ = "licenses"
    id = Column(Integer, primary_key=True)
    name = Column(Unicode)
    description = Column(Unicode)
    plain_text = Column(Unicode)
    projects = relationship("Project", backref='license')
    users = relationship("License", secondary=users_licenses_table)

    def __init__(self):
        pass

from json import (
    JSONEncoder,
    dumps as _dumps,
)
import functools


class ExtendedJSONEncoder(JSONEncoder):

    def default(self, obj):  # pragma: no cover

        if isinstance(obj, (datetime.date, datetime.datetime)):
            return obj.isoformat(' ')

        return JSONEncoder.default(self, obj)

dumps = functools.partial(_dumps, cls=ExtendedJSONEncoder)
