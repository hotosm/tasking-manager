import unittest
from . import db_url

class TestTaskFunctional(unittest.TestCase):

    def __create_project(self):
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

    def setUp(self):
        from osmtm import main
        from webtest import TestApp
        settings = {
            'available_languages': 'en',
            'sqlalchemy.url': db_url,
        }
        app = main({}, **settings)
        self.testapp = TestApp(app)

    def test_task(self):
        import transaction
        from osmtm.models import DBSession
        project = self.__create_project()
        DBSession.add(project)
        DBSession.flush()
        project_id = project.id
        transaction.commit()
        self.testapp.get('/project/%d/task/1' % project_id, status=200,
                xhr=True)
