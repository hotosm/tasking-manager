import unittest
import transaction

from pyramid import testing

from .models import (
    DBSession,
    Base,
    Map,
    Task,
    Tile
    )


def _initTestingDB():
    from sqlalchemy import create_engine
    engine = create_engine('postgresql://www-data@localhost/osmtm_tests')
    DBSession.configure(bind=engine)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    with transaction.manager:
        map = Map(
            title=u'one',
            geometry='{"type":"Polygon","coordinates":[[[7.237243652343749,41.25922682850892],[7.23175048828125,41.12074559016745],[7.415771484374999,41.20552261955812],[7.237243652343749,41.25922682850892]]]}'
        )
        task = Task(
            map,
            u'Short task description',
            12
        )
        DBSession.add(map)

def _registerRoutes(config):
    config.add_route('home', '/')
    config.add_route('map_new', '/map/new')
    config.add_route('map', '/map/{map}')
    config.add_route('map_edit', '/map/{map}/edit')
    config.add_route('task_mapnik', '/task/{task}/{z}/{x}/{y}.{format}')

class TileModelTests(unittest.TestCase):

    def setUp(self):
        _initTestingDB()
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    def _getTargetClass(self):
        return Tile

    def _makeOne(self, x, y, z):
        return self._getTargetClass()(x, y, z)

    def test_constructor(self):
        x = 1
        y = 2
        z = 10
        instance = self._makeOne(x, y, z)
        self.assertEqual(instance.x, 1)
        self.assertEqual(instance.y, 2)
        self.assertEqual(instance.zoom, 10)

class TestMap(unittest.TestCase):
    def setUp(self):
        _initTestingDB()
        self.config = testing.setUp()
        _registerRoutes(self.config)

    def tearDown(self):
        DBSession.remove()
        testing.tearDown()

    def test_it(self):
        from .views.map import map
        request = testing.DummyRequest()

        request.matchdict = {'map': 1}
        info = map(request)
        from .models import Map
        self.assertEqual(info['map'], DBSession.query(Map).get(1))

        # doesn't exist
        request.matchdict = {'map': 999}
        response = map(request)
        self.assertEqual(response.location, 'http://example.com/')

class TestMapNew(unittest.TestCase):

    def setUp(self):
        self.config = testing.setUp()
        _registerRoutes(self.config)

    def tearDown(self):
        DBSession.remove()
        testing.tearDown()

    def test_it(self):
        from .views.map import map_new

        request = testing.DummyRequest()
        response = map_new(request)

        request = testing.DummyRequest()
        request.params = {
            'form.submitted': True,
            'title':u'NewMap',
            'geometry':'{"type":"Polygon","coordinates":[[[7.237243652343749,41.25922682850892],[7.23175048828125,41.12074559016745],[7.415771484374999,41.20552261955812],[7.237243652343749,41.25922682850892]]]}'
        }
        response = map_new(request)
        self.assertEqual(response.location, 'http://example.com/map/2/edit')

class TestMapEdit(unittest.TestCase):

    def setUp(self):
        self.config = testing.setUp()
        _registerRoutes(self.config)

    def tearDown(self):
        DBSession.remove()
        testing.tearDown()

    def test_it(self):
        from .views.map import map_edit

        request = testing.DummyRequest()
        request.matchdict = {'map': 1}
        response = map_edit(request)
        from .models import Map
        self.assertEqual(response['map'], DBSession.query(Map).get(1))

        request = testing.DummyRequest()
        request.matchdict = {'map': 1}
        request.params = {
            'form.submitted': True,
            'title':u'NewMap',
            'short_description':u'SomeShortDescription',
            'description':u'SomeDescription',
        }
        response = map_edit(request)
        self.assertEqual(response.location, 'http://example.com/map/1')

class TestMapMapnik(unittest.TestCase):

    def setUp(self):
        self.config = testing.setUp()
        _registerRoutes(self.config)

    def tearDown(self):
        DBSession.remove()
        testing.tearDown()

    def test_it(self):
        from .views.map import task_mapnik

        request = testing.DummyRequest()
        request.matchdict = {
            'map': 1,
            'task': 1,
            'x': 532,
            'y': 383,
            'z': 10,
            'format': 'png'
        }
        response = task_mapnik(request)
        import mapnik
        self.assertEqual(isinstance(response[0], mapnik.Layer), True)

class FunctionalTests(unittest.TestCase):

    def setUp(self):
        from osmtm import main
        settings = {
            'sqlalchemy.url': 'postgresql://www-data@localhost/osmtm_tests'
        }
        self.app = main({}, **settings)

        from webtest import TestApp
        self.testapp = TestApp(self.app)

    def tearDown(self):
        DBSession.remove()
        testing.tearDown()

    def test_home(self):
        res = self.testapp.get('', status=200)
        self.failUnless('one' in res.body)

    def test_map_mapnik(self):
        res = self.testapp.get('/map/1/task/1/10/532/383.png')
        self.assertTrue(res.content_type == 'image/png')

        res = self.testapp.get('/map/1/task/1/10/532/383.json')
        self.assertTrue('grid' in res.body)
