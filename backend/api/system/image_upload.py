import json

import requests
from fastapi import APIRouter, Body, Depends, Request
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.users.authentication_service import login_required

router = APIRouter(
    prefix="/system",
    tags=["system"],
    responses={404: {"description": "Not found"}},
)


@router.post("/image-upload/")
async def post_image(
    request: Request,
    user: AuthUserDTO = Depends(login_required),
    data: dict = Body(...),
):
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
      501:
        description: Image upload service not defined
    """
    if settings.IMAGE_UPLOAD_API_URL is None or settings.IMAGE_UPLOAD_API_KEY is None:
        return JSONResponse(
            content={
                "Error": "Image upload service not defined",
                "SubCode": "UndefinedImageService",
            },
            status_code=501,
        )

    if data.get("filename") is None:
        return JSONResponse(
            content={
                "Error": "Missing filename parameter",
                "SubCode": "MissingFilename",
            },
            status_code=400,
        )
    if data.get("mime") in [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
    ]:
        headers = {
            "x-api-key": settings.IMAGE_UPLOAD_API_KEY,
            "Content-Type": "application/json",
        }
        url = "{}?filename={}".format(settings.IMAGE_UPLOAD_API_URL, data.get("filename"))
        result = requests.post(url, headers=headers, data=json.dumps({"image": data}))
        if result.ok:
            return JSONResponse(content=result.json(), status_code=201)
        else:
            return JSONResponse(content=result.json(), status_code=400)
    elif data.get("mime") is None:
        return JSONResponse(
            content={
                "Error": "Missing mime parameter",
                "SubCode": "MissingMime",
            },
            status_code=400,
        )
    else:
        return JSONResponse(
            content={
                "Error": "Mimetype is not allowed. The supported formats are: png, jpeg, webp and gif.",
                "SubCode": "UnsupportedFile",
            },
            status_code=400,
        )
