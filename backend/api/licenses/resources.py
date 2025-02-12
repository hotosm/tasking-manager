from backend.models.dtos.licenses_dto import LicenseDTO
from backend.services.license_service import LicenseService
from backend.services.users.authentication_service import tm
from fastapi import APIRouter, Depends, Request
from backend.db.database import get_db
from starlette.authentication import requires
from loguru import logger

router = APIRouter(
    prefix="/licenses",
    tags=["licenses"],
    dependencies=[Depends(get_db)],
    responses={404: {"description": "Not found"}},
)

# class LicensesRestAPI(Resource):
@router.post("/")
@requires("authenticated")
@tm.pm_only()
def post(request: Request):
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
    try:
        license_dto = LicenseDTO(request.get_json())
        license_dto.validate()
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return {
            "Error": "Unable to create new mapping license",
            "SubCode": "InvalidData",
        }, 400

    new_license_id = LicenseService.create_licence(license_dto)
    return {"licenseId": new_license_id}, 201

@router.get("/{license_id}/")
async def get(request: Request, license_id):
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
    license_dto = LicenseService.get_license_as_dto(license_id)
    return license_dto.model_dump(by_alias=True), 200

@router.patch("/{license_id}/")
@requires("authenticated")
@tm.pm_only()
async def patch(request: Request, license_id):
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
    try:
        license_dto = LicenseDTO(request.json())
        license_dto.license_id = license_id
        license_dto.validate()
    except Exception as e:
        logger.error(f"Error validating request: {str(e)}")
        return {"Error": str(e), "SubCode": "InvalidData"}, 400

    updated_license = LicenseService.update_licence(license_dto)
    return updated_license.model_dump(by_alias=True), 200

@router.delete("/{license_id}/")
@requires("authenticated")
@tm.pm_only()
async def delete(request: Request, license_id):
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
    LicenseService.delete_license(license_id)
    return {"Success": "License deleted"}, 200


# class LicensesAllAPI(Resource):
@router.get("/")
async def get():
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
    licenses_dto = LicenseService.get_all_licenses()
    return licenses_dto.model_dump(by_alias=True), 200
