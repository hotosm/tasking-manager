import unittest
from sqlalchemy import create_engine
from osmtm.models import Base

db_url = 'postgresql://www-data:@localhost/osmtm_tests'

engine = create_engine(db_url)
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)

class BaseTestCase(unittest.TestCase):

    def setUp(self):
        from osmtm import main
        from webtest import TestApp
        settings = {
            'available_languages': 'en',
            'sqlalchemy.url': db_url,
        }
        app = main({}, **settings)
        self.testapp = TestApp(app)

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

