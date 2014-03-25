import unittest
import transaction
from sqlalchemy import create_engine
from osmtm.models import Base, User, DBSession
from osmtm.models import User, DBSession

db_url = 'postgresql://www-data:@localhost/osmtm_tests'

FOO_USER_ID = 1
ADMIN_USER_ID = 2

def populate_db():
    engine = create_engine(db_url)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    DBSession.configure(bind=engine)

    # those users are immutables ie. they're not suppose to change during tests
    user = User(FOO_USER_ID, u'foo_user', False)
    DBSession.add(user)
    DBSession.flush()

    user = User(ADMIN_USER_ID, u'admin_user', True)
    DBSession.add(user)
    DBSession.flush()
    transaction.commit()
    DBSession.remove()

populate_db()

class BaseTestCase(unittest.TestCase):

    foo_user_id = FOO_USER_ID
    admin_user_id = ADMIN_USER_ID

    def setUp(self):
        from osmtm import main
        from webtest import TestApp
        settings = {
            'available_languages': 'en',
            'sqlalchemy.url': db_url,
        }
        self.app = main({}, **settings)
        self.testapp = TestApp(self.app)

    def tearDown(self):
        del self.testapp
        from osmtm.models import DBSession
        DBSession.remove()

    def create_project(self):
        import geoalchemy2
        import shapely
        from osmtm.models import Area, Project
        shape = shapely.geometry.Polygon(
            [(7.23, 41.25), (7.23, 41.12), (7.41, 41.20)])
        geometry = geoalchemy2.shape.from_shape(shape, 4326)
        area = Area(geometry)
        project = Project(u'test project')
        project.area = area
        project.auto_fill(12)
        return project

    def remember(self, userid):
        from pyramid.security import remember
        from pyramid import testing
        request = testing.DummyRequest(environ={'SERVER_NAME': 'servername'})
        request.registry = self.app.registry
        headers = remember(request, userid, max_age=2*7*24*60*60)
        return {'Cookie': headers[0][1].split(';')[0]}

    def forget(self):
        from pyramid.security import forget
        from pyramid import testing
        request = testing.DummyRequest(environ={'SERVER_NAME': 'servername'})
        request.registry = self.app.registry
        forget(request)
