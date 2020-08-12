import requests
import json

from flask_restful import Resource, request, current_app

from backend.services.users.authentication_service import token_auth


class SystemImageUploadRestAPI(Resource):
    @token_auth.login_required
    def post(self):
        """
        Uploads an image using the image upload service
        ---
        tags:
          - system
        produces:
          - application/json
        parameters:
          - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
          - in: body
            name: body
            required: true
            description: JSON object containing image data that will be uploaded
            schema:
              properties:
                  data:
                      type: string
                      default: base64 encoded image data
                  mime:
                      type: string
                      default: file mime/type
                  filename:
                      type: string
                      default: filename
        responses:
          200:
            description: Image uploaded successfully
          400:
            description: Input parameter error
          403:
            description: User is not authorized to upload images
          500:
            description: A problem occurred
        """
        if (
            current_app.config["IMAGE_UPLOAD_API_URL"] is None
            or current_app.config["IMAGE_UPLOAD_API_KEY"] is None
        ):
            return {"Error": "Image upload service not defined"}, 500

        try:
            data = request.get_json()
            if data.get("filename") is None:
                return {"Error": "Missing filename parameter"}, 400
            if data.get("mime") in [
                "image/png",
                "image/jpeg",
                "image/webp",
                "image/gif",
            ]:
                headers = {
                    "x-api-key": current_app.config["IMAGE_UPLOAD_API_KEY"],
                    "Content-Type": "application/json",
                }
                url = "{}?filename={}".format(
                    current_app.config["IMAGE_UPLOAD_API_URL"], data.get("filename")
                )
                result = requests.post(
                    url, headers=headers, data=json.dumps({"image": data})
                )
                if result.ok:
                    return result.json(), 201
                else:
                    return result.json(), 400
            else:
                return (
                    {
                        "Error": "Mimetype is not allowed. The supported formats are: png, jpeg, webp and gif."
                    },
                    400,
                )
        except Exception as e:
            error_msg = f"Image upload POST API - unhandled error: {str(e)}"
            current_app.logger.critical(error_msg)
            return {"Error": "Unable to upload image"}, 500
