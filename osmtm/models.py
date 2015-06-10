from sqlalchemy import (
    Table,
    Column,
    Float,
    Integer,
    BigInteger,
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

from sqlalchemy.ext.hybrid import (
    hybrid_property
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

from json import (
    JSONEncoder,
    dumps as _dumps,
)
import functools

from sqlalchemy_i18n import (
    Translatable,
    make_translatable,
    translation_base,
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

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()
make_translatable()

users_licenses_table = Table(
    'users_licenses', Base.metadata,
    Column('user', BigInteger, ForeignKey('users.id')),
    Column('license', Integer, ForeignKey('licenses.id')))

# user roles
ADMIN = 1
PROJECT_MANAGER = 2


class User(Base):
    __tablename__ = "users"
    id = Column(BigInteger, primary_key=True, index=True)
    username = Column(Unicode)
    role_admin = ADMIN
    role_project_manager = PROJECT_MANAGER
    role = Column(Integer)

    accepted_licenses = relationship("License", secondary=users_licenses_table)
    private_projects = relationship("Project",
                                    secondary="project_allowed_users")
    unread_messages = relationship(
        'Message',
        primaryjoin=lambda: and_(
            User.id == Message.to_user_id,
            Message.read.isnot(True)
        ))

    def __init__(self, id, username):
        self.id = id
        self.username = username

    @hybrid_property
    def is_admin(self):
        return self.role is self.role_admin

    @hybrid_property
    def is_project_manager(self):
        return self.role is self.role_project_manager

    def as_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "is_admin": self.is_admin,
            "is_project_manager": self.is_project_manager
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
    user_id = Column(BigInteger, ForeignKey('users.id'))
    user = relationship(User)
    date = Column(DateTime, default=datetime.datetime.utcnow)

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


class TaskLock(Base):
    __tablename__ = "task_lock"
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer)
    project_id = Column(Integer)
    lock = Column(Boolean)
    user_id = Column(BigInteger, ForeignKey('users.id'))
    user = relationship(User)
    date = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (ForeignKeyConstraint([task_id, project_id],
                                           ['task.id', 'task.project_id']),
                      Index('task_lock_task_project_index',
                            'task_id',
                            'project_id'),
                      Index('task_lock_date', date.desc()),
                      {})

    def __init__(self, user=None, lock=None):
        self.user = user
        self.lock = lock


@event.listens_for(TaskLock, "after_insert")
def task_lock_after_insert(mapper, connection, target):
    task_table = Task.__table__
    date = target.date if target.lock is True else None
    connection.execute(
        task_table.update().
        where(and_(task_table.c.id == target.task_id,
                   task_table.c.project_id == target.project_id)).
        values(lock_date=date)
    )


class TaskComment(Base):
    __tablename__ = "task_comment"
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer)
    project_id = Column(Integer)

    comment = Column(Unicode)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    author_id = Column(BigInteger, ForeignKey('users.id'))
    author = relationship(User)

    __table_args__ = (ForeignKeyConstraint([task_id, project_id],
                                           ['task.id', 'task.project_id']),
                      Index('task_comment_task_project_index',
                            'task_id',
                            'project_id'),
                      Index('task_comment_date', date.desc()),
                      {})

    def __init__(self, comment, author):
        self.comment = comment
        self.author = author


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
    date = Column(DateTime, default=datetime.datetime.utcnow)
    lock_date = Column(DateTime, default=None)

    assigned_to_id = Column(Integer, ForeignKey('users.id'))
    assigned_to = relationship(User)
    assigned_date = Column(DateTime)

    difficulty_easy = 1
    difficulty_medium = 2
    difficulty_hard = 3
    difficulty = Column(Integer)

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

    comments = relationship(
        TaskComment,
        order_by="desc(TaskComment.date)",
        cascade="all, delete, delete-orphan",
        backref="task")

    __table_args__ = (PrimaryKeyConstraint('project_id', 'id'),
                      Index('task_lock_date_', date.desc()),
                      {},)

    def __init__(self, x, y, zoom, geometry=None):
        self.x = x
        self.y = y
        self.zoom = zoom
        if geometry is None:
            geometry = self.to_polygon()
            multipolygon = MultiPolygon([geometry])
            geometry = ST_Transform(shape.from_shape(multipolygon, 3857), 4326)

        self.geometry = geometry

        self.states.append(TaskState())
        self.locks.append(TaskLock())

    def to_polygon(self):
        # task size (in meters) at the required zoom level
        step = max / (2 ** (self.zoom - 1))
        tb = TileBuilder(step)
        return tb.create_square(self.x, self.y)

    def to_feature(self):
        properties = {
            'state': self.cur_state.state if self.cur_state else 0,
            'locked': self.lock_date is not None
        }
        if self.x and self.y and self.zoom:
            properties['x'] = self.x
            properties['y'] = self.y
            properties['zoom'] = self.zoom
        return Feature(
            geometry=shape.to_shape(self.geometry),
            id=self.id,
            properties=properties
        )


@event.listens_for(Task, "after_update")
def after_update(mapper, connection, target):
    project_table = Project.__table__
    project = target.project
    connection.execute(
        project_table.update().
        where(project_table.c.id == project.id).
        values(last_update=datetime.datetime.utcnow(),
               done=project.get_done(),
               validated=project.get_validated())
    )


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
    Column('user_id', BigInteger, ForeignKey('users.id'))
)


class PriorityArea(Base):
    __tablename__ = 'priority_area'
    id = Column(Integer, primary_key=True)
    geometry = Column(Geometry('Polygon', srid=4326))

    def __init__(self, geometry):
        self.geometry = geometry

project_priority_areas = Table(
    'project_priority_areas',
    Base.metadata,
    Column('project_id', Integer, ForeignKey('project.id')),
    Column('priority_area_id', Integer, ForeignKey('priority_area.id'))
)


# A project corresponds to a given mapping job to do on a given area
# Example 1: trace the major roads
# Example 2: trace the buildings
# Each has its own grid with its own task size.
class Project(Base, Translatable):
    __tablename__ = 'project'
    id = Column(Integer, primary_key=True)

    status_archived = 0
    status_published = 1
    status_draft = 2
    status = Column(Integer, default=status_draft)

    locale = 'en'

    area_id = Column(Integer, ForeignKey('areas.id'))
    created = Column(DateTime, default=datetime.datetime.utcnow)
    author_id = Column(BigInteger, ForeignKey('users.id'))
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
    done = Column(Float, default=0)
    # percentage of validated tasks
    validated = Column(Float, default=0)

    __table_args__ = (CheckConstraint(priority.in_(range(0, 4))), )

    entities_to_map = Column(Unicode)
    changeset_comment = Column(Unicode)

    private = Column(Boolean, default=False)
    allowed_users = relationship(User,
                                 secondary=project_allowed_users)

    josm_preset = Column(Unicode)

    due_date = Column(DateTime)

    priority_areas = relationship(PriorityArea,
                                  secondary=project_priority_areas)

    def __init__(self, name, user=None):
        self.name = name
        self.author = user

    # auto magically fills the area with tasks for the given zoom
    def auto_fill(self, zoom):
        self.zoom = zoom
        geom_3857 = DBSession.execute(ST_Transform(self.area.geometry, 3857)) \
                             .scalar()
        geom_3857 = shape.to_shape(geom_3857)

        tasks = []
        for i in get_tiles_in_geom(geom_3857, zoom):
            multi = MultiPolygon([i[2]])
            geometry = ST_Transform(shape.from_shape(multi, 3857), 4326)
            tasks.append(Task(i[0], i[1], zoom, geometry))
        self.tasks = tasks

    def import_from_geojson(self, input):

        geoms = parse_geojson(input)

        tasks = []
        for geom in geoms:
            if not isinstance(geom, MultiPolygon):
                geom = MultiPolygon([geom])
            tasks.append(Task(None, None, None, 'SRID=4326;%s' % geom.wkt))

        self.tasks = tasks

        DBSession.add(self)
        DBSession.flush()

        bounds = DBSession.query(ST_Union(ST_Buffer(Task.geometry, 0.01))) \
            .filter(Task.project_id == self.id).one()
        self.area = Area(bounds[0])

        return len(tasks)

    def get_done(self):
        total = DBSession.query(func.sum(ST_Area(Task.geometry))) \
            .filter(
                Task.project_id == self.id,
                Task.cur_state.has(TaskState.state != TaskState.state_removed)
            ) \
            .scalar()

        done = DBSession.query(func.sum(ST_Area(Task.geometry))) \
            .filter(
                Task.project_id == self.id,
                Task.cur_state.has(TaskState.state == TaskState.state_done)
            ) \
            .scalar()

        if not done:
            done = 0

        return round(done * 100 / total, 2) if total != 0 else 0

    def get_validated(self):
        total = DBSession.query(func.sum(ST_Area(Task.geometry))) \
            .filter(
                Task.project_id == self.id,
                Task.cur_state.has(TaskState.state != TaskState.state_removed)
            ) \
            .scalar()

        validated = DBSession.query(func.sum(ST_Area(Task.geometry))) \
            .filter(
                Task.project_id == self.id,
                Task.cur_state.has(
                    TaskState.state == TaskState.state_validated)
            ) \
            .scalar()

        if not validated:
            validated = 0

        return round(validated * 100 / total, 2) if total != 0 else 0

    def to_bbox(self):
        return shape.to_shape(self.area.geometry).bounds

    # get the count of currently locked tasks
    def get_locked(self):

        query = DBSession.query(Task) \
            .filter(and_(Task.lock_date.__ne__(None),
                         Task.project_id == self.id))

        return query.count()

    def to_feature(self):
        properties = {}
        properties['name'] = self.name
        properties['description'] = self.description
        properties['short_description'] = self.short_description
        properties['instructions'] = self.instructions
        properties['per_task_instructions'] = self.per_task_instructions
        properties['status'] = self.status
        properties['created'] = self.created.strftime('%FT%TZ')
        if self.author:
            properties['author'] = self.author.username
        properties['last_update'] = self.last_update.strftime('%FT%TZ')
        properties['license'] = self.license_id
        properties['priority'] = self.priority
        properties['done'] = self.done
        properties['validated'] = self.validated
        properties['changeset_comment'] = self.changeset_comment

        return Feature(
            geometry=shape.to_shape(self.area.geometry),
            id=self.id,
            properties=properties
        )


# the time delta after which the task is unlocked (in seconds)
EXPIRATION_DELTA = datetime.timedelta(seconds=2 * 60 * 60)


@event.listens_for(Project, "after_insert")
def project_after_insert(mapper, connection, target):
    project_table = Project.__table__
    connection.execute(
        project_table.update().
        where(project_table.c.id == target.id).
        values(changeset_comment=u'#hotosm-project-%d' % target.id)
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


class Message(Base):
    __tablename__ = "message"
    id = Column(Integer, primary_key=True)
    message = Column(Unicode)
    subject = Column(Unicode)

    from_user_id = Column(BigInteger, ForeignKey('users.id'))
    from_user = relationship(User, foreign_keys=[from_user_id])

    to_user_id = Column(BigInteger, ForeignKey('users.id'))
    to_user = relationship(User, foreign_keys=[to_user_id],
                           backref='messages')

    date = Column(DateTime, default=datetime.datetime.utcnow)
    read = Column(Boolean)

    def __init__(self, subject, from_, to, message):
        self.subject = subject
        self.from_user = from_
        self.to_user = to
        self.message = message


class ExtendedJSONEncoder(JSONEncoder):

    def default(self, obj):  # pragma: no cover

        if isinstance(obj, (datetime.date, datetime.datetime)):
            return obj.isoformat(' ')

        return JSONEncoder.default(self, obj)

dumps = functools.partial(_dumps, cls=ExtendedJSONEncoder)
