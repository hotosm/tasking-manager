import os
import json
import unittest
from unittest.mock import patch
from server.services.ml_enabler_service import MLEnablerService
from server import create_app


class TestMLEnablerService(unittest.TestCase):
    out_file = '/tmp/ml_out_file.json'
    err_file = '/tmp/ml_err_file.json'
    agg_out_file = '/tmp/ml_aggregated_out_file.json'

    def setUp(self):
        """
        Setup test context so we can connect to database
        """
        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()
        self.model = 'looking_glass'
        self.bbox = '-86.3001904518,12.1460982787,-86.2963900131,12.1492471534'

    @classmethod
    def clean_files(cls):
        '''Deletes the temp files for out, err and aggregated file'''
        files = [cls.out_file, cls.err_file, cls.agg_out_file]
        for f in files:
            try:
                os.remove(f)
            except:
                pass

    @classmethod
    def tearDownClass(cls):
        cls.clean_files()

    @classmethod
    def setUpClass(cls):
        cls.clean_files()

    @unittest.skip("skipping for CI")
    def test_get_all_models(self):
        json = MLEnablerService.get_all_models()
        self.assertEqual(type(json), list)

    @unittest.skip("skipping for CI")
    def test_get_prediction_from_bbox(self):
        json = MLEnablerService.get_prediction_from_bbox(self.model, self.bbox, 18)
        self.assertEqual(type(json), dict)

    @unittest.skip("skipping for CI")
    def test_send_a_prediction_job(self):
        MLEnablerService.send_prediction_job(self.bbox, 18, self.out_file,
                                             self.err_file)

        self.assertTrue(os.path.exists(self.err_file))
        self.assertTrue(os.path.exists(self.out_file))

        with open(self.out_file, 'r') as out:
            obj = json.loads(out.read())
            self.assertEqual(type(obj), dict)
            self.assertGreater(len(obj['predictions']), 0)

    @unittest.skip("skipping for CI")
    def test_send_aggregation_job(self):
        #this test needs the outfile first to work
        #this file is produced by the other test
        if not os.path.exists(self.out_file):
            self.test_send_a_prediction_job()

        MLEnablerService.send_aggregation_job(18, self.out_file,
                                             self.agg_out_file)

        self.assertTrue(os.path.exists(self.agg_out_file))

        with open(self.agg_out_file, 'r') as out:
            obj = json.loads(out.read())
            self.assertEqual(type(obj), dict)
            self.assertGreater(len(obj['predictions']), 0)

    @unittest.skip("skipping for CI")
    def test_upload_prediction(self):
        #this test needs the aggregated file first to work
        #this file is produced by the test_send_aggregation_job test
        if not os.path.exists(self.agg_out_file):
            self.test_send_aggregation_job()

        MLEnablerService.upload_prediction(self.agg_out_file)
