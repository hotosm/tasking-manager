import unittest
import transaction
from sqlalchemy import create_engine
from osmtm.models import (
    Base,
    User,
    License,
    Area,
    Project,
    DBSession,
)
from sqlalchemy_i18n.manager import translation_manager

db_url = 'postgresql://www-data:@localhost/osmtm_tests'

USER1_ID = 1
USER2_ID = 2
ADMIN_USER_ID = 3

translation_manager.options.update({
    'locales': 'en fr',
    'get_locale_fallback': True
})


def populate_db():
    import geoalchemy2
    import shapely

    engine = create_engine(db_url)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    DBSession.configure(bind=engine)

    # those users are immutables ie. they're not suppose to change during tests
    user = User(USER1_ID, u'user1', False)
    DBSession.add(user)

    user = User(USER2_ID, u'user2', False)
    DBSession.add(user)

    user = User(ADMIN_USER_ID, u'admin_user', True)
    DBSession.add(user)

    license = License()
    license.name = u'LicenseBar'
    license.description = u'the_description_for_license_bar'
    license.plain_text = u'the_plain_text_for_license_bar'
    DBSession.add(license)

    shape = shapely.geometry.Polygon(
        [(7.23, 41.25), (7.23, 41.12), (7.41, 41.20)])
    geometry = geoalchemy2.shape.from_shape(shape, 4326)
    area = Area(geometry)
    project = Project(u'test project')
    project.area = area
    project.auto_fill(12)
    DBSession.add(project)

    transaction.commit()
    DBSession.remove()

populate_db()


class BaseTestCase(unittest.TestCase):

    user1_id = USER1_ID
    user2_id = USER2_ID
    admin_user_id = ADMIN_USER_ID

    def setUp(self):
        from osmtm import main
        from webtest import TestApp
        settings = {
            'available_languages': 'en fr',
            'sqlalchemy.url': db_url,
        }
        self.app = main({}, **settings)
        self.testapp = TestApp(self.app)

    def tearDown(self):
        del self.testapp
        from osmtm.models import DBSession
        DBSession.bind.dispose()  # dispose engine
        DBSession.remove()

        # forget any remembered authentication
        self.__forget()

    def login_as_admin(self):
        return self.__remember(self.admin_user_id)

    def login_as_user1(self):
        return self.__remember(self.user1_id)

    def login_as_user2(self):
        return self.__remember(self.user2_id)

    def __remember(self, userid):
        from pyramid.security import remember
        from pyramid import testing
        request = testing.DummyRequest(environ={'SERVER_NAME': 'servername'})
        request.registry = self.app.registry
        headers = remember(request, userid, max_age=2 * 7 * 24 * 60 * 60)
        return {'Cookie': headers[0][1].split(';')[0]}

    def __forget(self):
        from pyramid.security import forget
        from pyramid import testing
        request = testing.DummyRequest(environ={'SERVER_NAME': 'servername'})
        request.registry = self.app.registry
        forget(request)
