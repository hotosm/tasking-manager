import json
import geojson

from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_user,
    generate_encoded_token,
    get_canned_json,
)


class TestProjectActionsIntersectingTilesAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.url = "/api/v2/projects/actions/intersecting-tiles/"
        self.test_user = create_canned_user()
        self.test_user_access_token = generate_encoded_token(self.test_user.id)

    def test_returns_401_if_not_authenticated(self):
        """ Test that the endpoint returns 401 if the user is not authenticated """
        # Act
        response = self.client.post(self.url)
        # Assert
        self.assertEqual(response.status_code, 401)

    def test_returns_400_if_invalid_data(self):
        """ Test that the endpoint returns 400 if the data is invalid """
        # Act
        response = self.client.post(
            self.url,
            json={"grid": "invalid"},
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 400)

    def test_returns_clipped_grid_if_clip_to_aoi_set_true(self):
        """ Test that the endpoint returns a clipped grid if clipToAoi is set to true """
        # Arrange
        payload = get_canned_json("test_grid.json")
        payload["clipToAoi"] = True
        expected_response = geojson.loads(
            json.dumps(get_canned_json("clipped_feature_collection.json"))
        )
        # Act
        response = self.client.post(
            self.url,
            json=payload,
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(response.json, expected_response)

    def test_returns_not_clipped_grid_if_clip_to_aoi_set_false(self):
        """ Test that the endpoint returns a not clipped grid if clipToAoi is set to false """
        # Arrange
        payload = get_canned_json("test_grid.json")
        payload["clipToAoi"] = False
        expected_response = geojson.loads(
            json.dumps(get_canned_json("feature_collection.json"))
        )
        # Act
        response = self.client.post(
            self.url,
            json=payload,
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(response.json, expected_response)

    def test_raises_invalid_geojson_exception_if_invalid_aoi(self):
        """ Test that the endpoint raises an InvalidGeoJson exception if the grid is invalid """
        # Arrange
        payload = get_canned_json("test_grid.json")
        payload["areaOfInterest"]["features"] = []
        # Act
        response = self.client.post(
            self.url,
            json=payload,
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "MustHaveFeatures")

    def test_raises_invalid_geojson_exception_if_self_intersecting_aoi(self):
        """ Test that the endpoint raises an InvalidGeoJson exception if the aoi is self intersecting """
        # Arrange
        payload = get_canned_json("self_intersecting_aoi.json")
        # Act
        response = self.client.post(
            self.url,
            json=payload,
            headers={"Authorization": self.test_user_access_token},
        )
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["SubCode"], "SelfIntersectingAOI")


