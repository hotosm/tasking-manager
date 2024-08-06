import unittest
import os

from typing import Optional
from shapely.geometry import shape
from backend import create_app, db
import geojson
from flask import Flask
from flask_sqlalchemy import SQLAlchemy


def clean_db(db):
    for table in reversed(db.metadata.sorted_tables):
        db.session.execute(table.delete())


class BaseTestCase(unittest.TestCase):
    DEFAULT_PRECISION: Optional[int]
    app: Optional[Flask]
    db: Optional[SQLAlchemy]

    @classmethod
    def setUpClass(cls):
        super(BaseTestCase, cls).setUpClass()
        cls.DEFAULT_PRECISION = geojson.geometry.DEFAULT_PRECISION
        # OSM uses 7, which means the worst error of longitude is ±5.56595 mm
        # at the equator. The worst error for 6 decimal places of longitude is
        # ±5.56595 cm at the equator. This is the default, and realistically
        # is probably more than enough for the TM.
        geojson.geometry.DEFAULT_PRECISION = 7

        # Set the "TM_ENVIRONMENT" environment variable to "test" to use the test configuration
        os.environ["TM_ENVIRONMENT"] = "test"
        cls.app = create_app("backend.config.TestEnvironmentConfig")
        cls.app.config.update({"TESTING": True})
        cls.db = db
        cls.db.app = cls.app
        with cls.app.app_context():
            cls.db.create_all()

    @classmethod
    def tearDownClass(cls):
        geojson.geometry.DEFAULT_PRECISION = cls.DEFAULT_PRECISION
        with cls.app.app_context():
            db.session.remove()
            cls.db.drop_all()
            if cls.app in cls.db.engines:
                cls.db.engines[cls.app].dispose()
            if None in cls.db.engines:
                cls.db.engines[None].dispose()
        super(BaseTestCase, cls).tearDownClass()

    def setUp(self):
        super(BaseTestCase, self).setUp()
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        clean_db(self.db)

    def tearDown(self):
        super(BaseTestCase, self).tearDown()
        self.db.session.rollback()
        self.db.session.close()
        self.app_context.pop()

    # Code modified from https://github.com/larsbutler/oq-engine/blob/master/tests/utils/helpers.py
    # Note: Was originally in test_resources.py (author Aadesh-Baral)
    def assertDeepAlmostEqual(self, expected, actual, *args, **kwargs):
        """
        Assert that two complex structures have almost equal contents.

        Compares lists, dicts and tuples recursively. Checks numeric values
        using test_case's :py:meth:`unittest.TestCase.assertAlmostEqual` and
        checks all other values with :py:meth:`unittest.TestCase.assertEqual`.
        Accepts additional positional and keyword arguments and pass those
        intact to assertAlmostEqual() (that's how you specify comparison
        precision).

        :type test_case: :py:class:`unittest.TestCase` object
        """
        kwargs.pop("__trace", "ROOT")
        if (
            hasattr(expected, "__geo_interface__")
            and hasattr(actual, "__geo_interface__")
            and expected.__geo_interface__["type"] == actual.__geo_interface__["type"]
            and expected.__geo_interface__["type"]
            not in ["Feature", "FeatureCollection"]
        ):
            shape_expected = shape(expected)
            shape_actual = shape(actual)
            assert shape_expected.equals(shape_actual)
        elif isinstance(expected, (int, float, complex)):
            self.assertAlmostEqual(expected, actual, *args, **kwargs)
        elif isinstance(expected, (list, tuple)):
            self.assertEqual(len(expected), len(actual))
            for index in range(len(expected)):
                v1, v2 = expected[index], actual[index]
                self.assertDeepAlmostEqual(v1, v2, __trace=repr(index), *args, **kwargs)
        elif isinstance(expected, dict):
            self.assertEqual(set(expected), set(actual))
            for key in expected:
                self.assertDeepAlmostEqual(
                    expected[key], actual[key], __trace=repr(key), *args, **kwargs
                )
        else:
            self.assertEqual(expected, actual)
