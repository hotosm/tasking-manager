from databases import Database
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from backend.db import get_db
from backend.models.dtos.licenses_dto import LicenseDTO
from backend.models.dtos.user_dto import AuthUserDTO
from backend.services.license_service import LicenseService
from backend.services.users.authentication_service import pm_only

router = APIRouter(
    prefix="/licenses",
    tags=["licenses"],
    responses={404: {"description": "Not found"}},
)


@router.post("/")
async def post_license(
    license_dto: LicenseDTO,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(pm_only),
):
    """
    Creates a new mapping license
    ---
    tags:
        - licenses
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
            description: JSON object for creating a new mapping license
            schema:
                properties:
                    name:
                        type: string
                        default: Public Domain
                    description:
                        type: string
                        default: This imagery is in the public domain.
                    plainText:
                        type: string
                        default: This imagery is in the public domain.
    responses:
        201:
            description: New license created
        400:
            description: Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        500:
            description: Internal Server Error
    """
    new_license_id = await LicenseService.create_license(license_dto, db)
    return JSONResponse(content={"licenseId": new_license_id}, status_code=201)


@router.get("/{license_id}/")
async def retrieve_license(
    license_id: int,
    db: Database = Depends(get_db),
):
    """
    Get a specified mapping license
    ---
    tags:
        - licenses
    produces:
        - application/json
    parameters:
        - name: license_id
            in: path
            description: Unique license ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: License found
        404:
            description: License not found
        500:
            description: Internal Server Error
    """
    license_dto = await LicenseService.get_license_as_dto(license_id, db)
    return license_dto


@router.patch("/{license_id}/")
async def patch_license(
    license_dto: LicenseDTO,
    license_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(pm_only),
):
    """
    Update a specified mapping license
    ---
    tags:
        - licenses
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - name: license_id
            in: path
            description: Unique license ID
            required: true
            type: integer
            default: 1
        - in: body
            name: body
            required: true
            description: JSON object for updating a specified mapping license
            schema:
                properties:
                    name:
                        type: string
                        default: Public Domain
                    description:
                        type: string
                        default: This imagery is in the public domain.
                    plainText:
                        type: string
                        default: This imagery is in the public domain.
    responses:
        200:
            description: License updated
        400:
            description: Invalid Request
        401:
            description: Unauthorized - Invalid credentials
        500:
            description: Internal Server Error
    """
    await LicenseService.update_license(license_dto, license_id, db)
    return JSONResponse(content={"status": "Updated"}, status_code=200)


@router.delete("/{license_id}/")
async def delete_license(
    license_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(pm_only),
):
    """
    Delete a specified mapping license
    ---
    tags:
        - licenses
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - name: license_id
            in: path
            description: Unique license ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: License deleted
        401:
            description: Unauthorized - Invalid credentials
        404:
            description: License not found
        500:
            description: Internal Server Error
    """
    await LicenseService.delete_license(license_id, db)
    return JSONResponse(content={"Success": "License deleted"}, status_code=200)


@router.get("/")
async def get_licenses(db: Database = Depends(get_db)):
    """
    Get all imagery licenses
    ---
    tags:
        - licenses
    produces:
        - application/json
    responses:
        200:
            description: Licenses found
        404:
            description: Licenses not found
        500:
            description: Internal Server Error
    """
    licenses_dto = await LicenseService.get_all_licenses(db)
    return licenses_dto
