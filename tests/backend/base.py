import unittest

from backend import create_app, db


def clean_db(db):
    for table in reversed(db.metadata.sorted_tables):
        db.session.execute(table.delete())


class BaseTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.db = db
        self.db.app = self.app
        self.app.config["TESTING"] = True
        self.app_ctx = self.app.app_context()
        self.app_ctx.push()
        db.session.close()
        db.drop_all()
        db.create_all()
        self.client = self.app.test_client()

    def tearDown(self):
        db.session.remove()
        self.app_ctx.pop()
