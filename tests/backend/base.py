import unittest

from flask_sqlalchemy import SQLAlchemy

from backend import create_app

db = SQLAlchemy()


class BaseTestCase(unittest.TestCase):
    def setUp(self):
        app = create_app("backend.config.TestEnvironmentConfig")
        self.context = app.test_request_context()
        self.context.push()
        self.client = app.test_client()
        self.runner = app.test_cli_runner()
        db.create_all()

    def tearDown(self):
        db.drop_all()
        self.context.pop()
