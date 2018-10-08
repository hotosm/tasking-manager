import unittest

from server import create_app

class TestBrokenTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_broken_test(self):
        self.assertEqual(1, 0)