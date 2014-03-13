import unittest
import transaction

from pyramid import testing

from .models import (
    DBSession,
    Base,
    Area,
    Project
    )

from geoalchemy2 import (
    Geometry,
    shape,
    elements,
    )

from BeautifulSoup import BeautifulSoup

from sqlalchemy_i18n.manager import translation_manager
from sqlalchemy.orm import configure_mappers

def _initTestingDB():
    from sqlalchemy import create_engine
    engine = create_engine('postgresql://www-data@localhost/osmtm_tests')
    DBSession.configure(bind=engine)
    translation_manager.options.update({
        'locales': ['en'],
        'get_locale_fallback': True
    })
    configure_mappers()
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    with transaction.manager:
        import shapely
        import geojson
        geometry = '{"type":"Polygon","coordinates":[[[7.237243652343749,41.25922682850892],[7.23175048828125,41.12074559016745],[7.415771484374999,41.20552261955812],[7.237243652343749,41.25922682850892]]]}'
        geometry = geojson.loads(geometry, object_hook=geojson.GeoJSON.to_instance)
        geometry = shapely.geometry.asShape(geometry)
        geometry = shape.from_shape(geometry, 4326)

        area = Area(geometry)

        project = Project(
            u'Short project description',
        )
        project.area = area
        DBSession.add(project)
        project.auto_fill(12)

def _registerRoutes(config):
    config.add_route('home', '/')
    config.add_route('project_new', '/project/new')
    config.add_route('project', '/project/{project}')
    config.add_route('project_edit', '/project/{project}/edit')
    config.add_route('project_partition', '/project/{project}/partition')
    config.add_route('project_partition_grid', '/project/{project}/partition/grid')
    config.add_route('project_partition_import', '/project/{project}/partition/import')

class TestProject(unittest.TestCase):
    def setUp(self):
        _initTestingDB()
        self.config = testing.setUp()
        _registerRoutes(self.config)

    def tearDown(self):
        DBSession.remove()
        testing.tearDown()

    def test_it(self):
        from .views.project import project
        request = testing.DummyRequest()

        request.matchdict = {'project': 1}
        info = project(request)
        from .models import Project
        self.assertEqual(info['project'], DBSession.query(Project).get(1))

        # doesn't exist
        request.matchdict = {'project': 999}
        response = project(request)
        self.assertEqual(response.location, 'http://example.com/')

class TestProjectNewGrid(unittest.TestCase):

    def setUp(self):
        self.config = testing.setUp()
        _registerRoutes(self.config)

    def tearDown(self):
        DBSession.remove()
        testing.tearDown()

    def test_it(self):
        from .views.project import project_new
        self.config.testing_securitypolicy(userid=321)

        request = testing.DummyRequest()
        response = project_new(request)

        request = testing.DummyRequest()
        request.params = {
            'form.submitted': True,
            'name':u'NewProject',
            'type': 'grid'
        }
        response = project_new(request)
        self.assertEqual(response.location, 'http://example.com/project/2/partition/grid')

class TestProjectNewImport(unittest.TestCase):

    def setUp(self):
        self.config = testing.setUp()
        _registerRoutes(self.config)

    def tearDown(self):
        DBSession.remove()
        testing.tearDown()

    def test_it(self):
        from .views.project import project_new
        self.config.testing_securitypolicy(userid=321)

        request = testing.DummyRequest()
        response = project_new(request)

        request = testing.DummyRequest()
        request.params = {
            'form.submitted': True,
            'name':u'NewProject',
            'type': 'import'
        }
        response = project_new(request)
        self.assertEqual(response.location, 'http://example.com/project/3/partition/import')

class TestProjectEdit(unittest.TestCase):

    def setUp(self):
        self.config = testing.setUp()
        _registerRoutes(self.config)

    def tearDown(self):
        DBSession.remove()
        testing.tearDown()

    def test_it(self):
        from .views.project import project_edit

        request = testing.DummyRequest()
        request.matchdict = {'project': 1}
        response = project_edit(request)
        from .models import Project
        self.assertEqual(response['project'], DBSession.query(Project).get(1))

        request = testing.DummyRequest()
        request.matchdict = {'project': 1}
        request.params = {
            'form.submitted': True,
            'name_en':u'NewProject',
            'short_description_en':u'SomeShortDescription',
            'description_en':u'SomeDescription',
            'imagery': u'',
            'license_id': u''
        }
        response = project_edit(request)
        self.assertEqual(response.location, 'http://example.com/project/1')

#class TestTaskNew(unittest.TestCase):

    #def setUp(self):
        #self.config = testing.setUp()
        #_registerRoutes(self.config)

    #def tearDown(self):
        #DBSession.remove()
        #testing.tearDown()

    #def test_it(self):
        #from .views.task import task_new

        #request = testing.DummyRequest()
        #response = task_new(request)

        #request = testing.DummyRequest()
        #request.matchdict = {'project': 1}
        #request.params = {
            #'form.submitted': True,
            #'short_description':u'NewTask',
            #'zoom': 13
        #}
        #response = task_new(request)
        #self.assertEqual(response.location, 'http://example.com/project/1/tasks/manage')

#class TestTaskProjectnik(unittest.TestCase):

    #def setUp(self):
        #self.config = testing.setUp()
        #_registerRoutes(self.config)

    #def tearDown(self):
        #DBSession.remove()
        #testing.tearDown()

    #def test_it(self):
        #from .views.task import task_projectnik

        #request = testing.DummyRequest()
        #request.matchdict = {
            #'project': 1,
            #'task': 1,
            #'x': 532,
            #'y': 383,
            #'z': 10,
            #'format': 'png'
        #}
        #response = task_projectnik(request)
        #import projectnik
        #self.assertEqual(isinstance(response[0], projectnik.Layer), True)

#class FunctionalTests(unittest.TestCase):

    #def setUp(self):
        #from osmtm import main
        #settings = {
            #'sqlalchemy.url': 'postgresql://www-data@localhost/osmtm_tests'
        #}
        #self.app = main({}, **settings)

        #from webtest import TestApp
        #self.testapp = TestApp(self.app)

    #def tearDown(self):
        #DBSession.remove()
        #testing.tearDown()

    #def test_home(self):
        #res = self.testapp.get('', status=200)
        #self.failUnless('one' in res.body)

    #def test_tasks(self):
        #task = DBSession.query(Task).get(1)
        #self.assertEqual(len(task.tiles), 6)

    #def test_tasks_manage(self):
        #res = self.testapp.get('/project/1/tasks/manage')
        #self.assertEqual(len(res.html.findAll('li', {'class': 'task'})), 1)

    #def test_task_projectnik(self):
        #res = self.testapp.get('/project/1/task/1/10/532/383.png')
        #self.assertTrue(res.content_type == 'image/png')

        #res = self.testapp.get('/project/1/task/1/10/532/383.json')
        #self.assertTrue('grid' in res.body)

        #res = self.testapp.get('/project/2/task/1/10/532/383.png', status=400)
