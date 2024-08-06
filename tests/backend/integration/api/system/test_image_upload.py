from unittest.mock import patch


from tests.backend.base import BaseTestCase
from tests.backend.helpers.test_helpers import (
    create_canned_user,
    generate_encoded_token,
)


IMAGE_UPLOAD_API_URL = "http://localhost:5000"
IMAGE_UPLOAD_API_KEY = "test"


class TestSystemImageUploadRestAPI(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.user = create_canned_user()
        self.user_token = generate_encoded_token(self.user.id)
        self.url = "/api/v2/system/image-upload/"
        self.app.config["IMAGE_UPLOAD_API_URL"] = IMAGE_UPLOAD_API_URL
        self.app.config["IMAGE_UPLOAD_API_KEY"] = IMAGE_UPLOAD_API_KEY
        self.json = {"image": "test", "filename": "test.png", "mime": "image/png"}

    def test_returns_401_if_not_logged_in(self):
        url = "/api/v2/system/image-upload/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json["Error"], "Token is expired or invalid")
        self.assertEqual(response.json["SubCode"], "InvalidToken")

    def test_returns_501_if_upload_api_url_not_set(self):
        url = "/api/v2/system/image-upload/"
        self.app.config["IMAGE_UPLOAD_API_URL"] = None
        response = self.client.post(url, headers={"Authorization": self.user_token})
        self.assertEqual(response.status_code, 501)
        self.assertEqual(response.json["Error"], "Image upload service not defined")
        self.assertEqual(response.json["SubCode"], "UndefinedImageService")

    def test_returns_501_if_upload_api_key_not_set(self):
        url = "/api/v2/system/image-upload/"
        self.app.config["IMAGE_UPLOAD_API_KEY"] = None
        response = self.client.post(url, headers={"Authorization": self.user_token})
        self.assertEqual(response.status_code, 501)
        self.assertEqual(response.json["Error"], "Image upload service not defined")
        self.assertEqual(response.json["SubCode"], "UndefinedImageService")

    def test_returns_400_if_filename_not_set(self):
        url = "/api/v2/system/image-upload/"
        self.json["filename"] = None
        response = self.client.post(
            url, headers={"Authorization": self.user_token}, json=self.json
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["Error"], "Missing filename parameter")
        self.assertEqual(response.json["SubCode"], "MissingFilename")

    def test_returns_400_if_mime_not_set(self):
        url = "/api/v2/system/image-upload/"
        self.json["mime"] = None
        response = self.client.post(
            url, headers={"Authorization": self.user_token}, json=self.json
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["Error"], "Missing mime parameter")
        self.assertEqual(response.json["SubCode"], "MissingMime")

    def test_returns_400_if_mime_not_valid(self):
        url = "/api/v2/system/image-upload/"
        self.json["mime"] = "test"
        response = self.client.post(
            url, headers={"Authorization": self.user_token}, json=self.json
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json["Error"],
            "Mimetype is not allowed. The supported formats are: png, jpeg, webp and gif.",
        )
        self.assertEqual(response.json["SubCode"], "UnsupportedFile")

    @patch("requests.post")
    def test_returns_201_if_upload_successful(self, mock_post):
        url = "/api/v2/system/image-upload/"
        mock_post.return_value.ok = True
        mock_post.return_value.json.return_value = {
            "Success": "Image uploaded successfully",
            "SubCode": "ImageUploaded",
        }
        response = self.client.post(
            url, headers={"Authorization": self.user_token}, json=self.json
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json["Success"], "Image uploaded successfully")
        self.assertEqual(response.json["SubCode"], "ImageUploaded")
