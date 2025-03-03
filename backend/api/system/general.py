from datetime import datetime

import requests
from databases import Database
from fastapi import APIRouter, Body, Depends, Request
from fastapi.responses import JSONResponse

from backend.db import get_db
from backend.models.postgis.release_version import ReleaseVersion
from backend.services.messaging.smtp_service import SMTPService
from backend.services.settings_service import SettingsService

router = APIRouter(
    prefix="/system",
    tags=["system"],
    responses={404: {"description": "Not found"}},
)


@router.get("/docs/json/", response_class=JSONResponse)
async def get_docs(request: Request):
    """
    Generates Swagger UI readable JSON
    ---
    tags:
        - system
    definitions:
        - schema:
            id: GeoJsonPolygon
            properties:
                type:
                    type: string
                    default: Polygon
                coordinates:
                    type: array
                    items:
                        type: number
                        default: [[-4.0237,56.0904],[-3.9111,56.1715],[-3.8122,56.0980],[-4.0237,56.0904]]
        - schema:
            id: GeoJsonMultiPolygon
            properties:
                type:
                    type: string
                    default: MultiPolygon
                coordinates:
                    type: array
                    items:
                        type: number
                        default: [[[-4.0237,56.0904],[-3.9111,56.1715],[-3.8122,56.0980],[-4.0237,56.0904]]]
        - schema:
            id: ProjectInfo
            properties:
                locale:
                    type: string
                    default: en
                name:
                    type: string
                    default: Thinkwhere Project
                shortDescription:
                    type: string
                    default: Awesome little project
                description:
                    type: string
                    default: Awesome little project and a little bit more
                instructions:
                    type: string
                    default: Complete the tasks
                perTaskInstructions:
                    type: string
                    default: Use Thinkwhere Imagery Only
        - schema:
            id: GeoJsonFeature
            properties:
                type:
                    type: string
                    default: Feature
                geometry:
                    schema:
                            $ref: "#/definitions/GeoJsonMultiPolygon"
                properties:
                    type: object
                    properties:
                        x:
                            type: integer
                            default: 2402
                        y:
                            type: integer
                            default: 1736
                        zoom:
                            type: integer
                            default: 12
                        isSquare:
                            type: boolean
                            default: true
        - schema:
            id: ValidatedTask
            properties:
                taskId:
                    type: integer
                    default: 1
                status:
                    type: string
                    default: VALIDATED
                comment:
                    type: string
                    default: Nice work :)
        - schema:
            id: ResetTask
            properties:
                taskId:
                    type: integer
                    default: 1
                comment:
                    type: string
                    default: Work in progress
        - schema:
            id: ProjectTeams
            properties:
                teamId:
                    type: integer
                    default: 1
                role:
                    type: string
                    default: MAPPER
        - schema:
            id: TeamMembers
            properties:
                userName:
                    type: string
                    default: user_1
                function:
                    type: string
                    default: MANAGER


    """
    swag = request.app.openapi()
    swag["info"]["title"] = "Tasking Manager backend API"
    swag["info"]["description"] = "API endpoints for the backend"
    swag["info"]["version"] = "2.0.0"

    return JSONResponse(content=swag, status_code=200)


@router.get("/languages/")
async def get():
    """
    Gets all supported languages
    ---
    tags:
      - system
    produces:
      - application/json
    responses:
        200:
            description: Supported Languages
        500:
            description: Internal Server Error
    """
    languages = SettingsService.get_settings()
    return languages.model_dump(by_alias=True)


@router.get("/heartbeat/")
async def heartbeat(db: Database = Depends(get_db)):
    """
    Simple health-check, if this is unreachable load balancers should be configured to raise an alert
    ---
    tags:
      - system
    produces:
      - application/json
    responses:
      200:
        description: Service is Healthy
    """
    query = """
        SELECT tag_name, published_at
        FROM release_version
        ORDER BY published_at DESC
        LIMIT 1
    """
    release = await db.fetch_one(query)

    if release:
        release_info = {
            "version": release["tag_name"],
            "published_at": release["published_at"].isoformat(),
        }
    else:
        release_info = None

    return {"status": "Fastapi healthy", "release": release_info}


@router.post("/contact-admin/")
async def contact_admin(request: Request, data: dict = Body(...)):
    """
    Send an email to the system admin
    ---
    tags:
      - system
    produces:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        description: JSON object with the data of the message to send to the system admin
        schema:
            properties:
                name:
                    type: string
                    default: The name of the sender
                email:
                    type: string
                    default: The email of the sender
                content:
                    type: string
                    default: The content of the message
    responses:
      201:
        description: Email sent successfully
      400:
          description: Invalid Request
      501:
        description: Not Implemented
      500:
        description: A problem occurred
    """
    try:
        await SMTPService.send_contact_admin_email(data)
        return JSONResponse(content={"Success": "Email sent"}, status_code=201)
    except ValueError as e:
        return JSONResponse(content={"Error": str(e), "SubCode": "NotImplemented"}, status_code=501)


@router.post("/release/")
async def release(db: Database = Depends(get_db)):
    """
    Fetch latest release version form github and save to database.
    ---
    tags:
      - system
    produces:
      - application/json
    responses:
      201:
        description: Saved version successfully to database
      502:
        description: Couldn't fetch latest release from github
      500:
        description: Internal server error
    """
    response = requests.get("https://api.github.com/repos/hotosm/tasking-manager/releases/latest")
    try:
        tag_name = response.json()["tag_name"]
        published_date = response.json()["published_at"]
        published_date = datetime.strptime(published_date, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=None)
        release = await ReleaseVersion.get(db)
        if release is None:
            release = ReleaseVersion()
        if tag_name != release.tag_name:
            release.tag_name = tag_name
            release.published_at = published_date
            await release.save(db)
        return {
            "release_version": release.tag_name,
            "published_at": str(release.published_at),
        }
    except KeyError:
        return JSONResponse(
            content={
                "Error": "Couldn't fetch latest release from github",
                "SubCode": "GithubFetchError",
            },
            status_code=502,
        )
