# coding: utf8

import ConfigParser
import unittest
import transaction
from sqlalchemy import create_engine
from osmtm.models import (
    Base,
    User,
    License,
    Label,
    Area,
    Project,
    DBSession,
)
from sqlalchemy_i18n.manager import translation_manager

from pyramid import testing

local_settings_path = 'local.test.ini'

# raise an error if the file doesn't exist
with open(local_settings_path):
    pass

USER1_ID = 1
USER2_ID = 2
ADMIN_USER_ID = 3
PROJECT_MANAGER_USER_ID = 4
VALIDATOR_ID = 5
EXPERIENCED_MAPPER_ID = 6

translation_manager.options.update({
    'locales': ['en', 'fr'],
    'get_locale_fallback': True
})


def populate_db():
    import geoalchemy2
    import shapely

    testing.setUp()
    config = ConfigParser.ConfigParser()
    config.read(local_settings_path)
    db_url = config.get('app:main', 'sqlalchemy.url')
    engine = create_engine(db_url)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    DBSession.configure(bind=engine)

    # those users are immutables ie. they're not suppose to change during tests
    user = User(USER1_ID, u'user1')
    DBSession.add(user)

    user = User(USER2_ID, u'user2')
    DBSession.add(user)

    user = User(ADMIN_USER_ID, u'admin_user')
    user.role = User.role_admin
    DBSession.add(user)

    user = User(PROJECT_MANAGER_USER_ID, u'project_manager_user')
    user.role = User.role_project_manager
    DBSession.add(user)

    user = User(VALIDATOR_ID, u'user_validator')
    user.role = User.role_validator
    DBSession.add(user)

    user = User(EXPERIENCED_MAPPER_ID, u'user_experienced_mapper')
    user.role = User.role_experienced_mapper
    DBSession.add(user)

    license = License()
    license.name = u'LicenseBar'
    license.description = u'the_description_for_license_bar'
    license.plain_text = u'the_plain_text_for_license_bar'
    DBSession.add(license)

    label0 = Label()
    label0.name = u'bar'
    label0.color = u'#ff0000'
    DBSession.add(label0)

    label1 = Label()
    label1.name = u'dude label'
    label1.color = u'#ff0000'
    DBSession.add(label1)

    shape = shapely.geometry.Polygon(
        [(7.23, 41.25), (7.23, 41.12), (7.41, 41.20)])
    geometry = geoalchemy2.shape.from_shape(shape, 4326)
    area = Area(geometry)
    project = Project(u'test project')
    project.short_description = u'lorem ipsum description'
    project.area = area
    project.auto_fill(12)
    project.status = Project.status_published
    project.labels = [label0, label1]
    DBSession.add(project)

    transaction.commit()
    DBSession.remove()


populate_db()


class BaseTestCase(unittest.TestCase):

    user1_id = USER1_ID
    user2_id = USER2_ID
    admin_user_id = ADMIN_USER_ID
    project_manager_user_id = PROJECT_MANAGER_USER_ID
    validator_user_id = VALIDATOR_ID

    def setUp(self):
        from osmtm import main
        from webtest import TestApp
        self.config = testing.setUp()
        settings = {
            'available_languages': 'en fr',
            'available_languages_full': 'English, Français',
            'local_settings_path': local_settings_path
        }
        self.app = main({}, **settings)
        self.testapp = TestApp(self.app)

    def tearDown(self):
        del self.testapp
        from osmtm.models import DBSession
        DBSession.bind.dispose()  # dispose engine
        DBSession.remove()
        testing.tearDown()
        # forget any remembered authentication
        self.__forget()

    def login_as_admin(self):
        return self.__remember(self.admin_user_id)

    def login_as_project_manager(self):
        return self.__remember(self.project_manager_user_id)

    def login_as_user1(self):
        return self.__remember(self.user1_id)

    def login_as_user2(self):
        return self.__remember(self.user2_id)

    def login_as_validator(self):
        return self.__remember(self.validator_user_id)

    def login_as_user(self, user_id):
        return self.__remember(user_id)

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
