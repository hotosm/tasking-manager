# from flask_restful import Resource, request
import json
from databases import Database
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from backend.db import get_db
from backend.models.dtos.partner_dto import PartnerDTO
from backend.models.dtos.user_dto import AuthUserDTO
from backend.models.postgis.user import User
from backend.services.partner_service import PartnerService, PartnerServiceError
from backend.services.users.authentication_service import login_required

router = APIRouter(
    prefix="/partners",
    tags=["partners"],
    dependencies=[Depends(get_db)],
    responses={404: {"description": "Not found"}},
)


@router.get("/{partner_id:int}/")
async def retrieve_partner(
    request: Request,
    partner_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Get partner by id
    ---
    tags:
        - partners
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - name: partner_id
            in: path
            description: The id of the partner
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Partner found
        401:
            description: Unauthorized - Invalid credentials
        404:
            description: Partner not found
        500:
            description: Internal Server Error
    """

    request_user = await User.get_by_id(user.id, db)
    if request_user.role != 1:
        return JSONResponse(
            content={
                "Error": "Only admin users can manage partners.",
                "SubCode": "OnlyAdminAccess",
            },
            status_code=403,
        )

    partner = await PartnerService.get_partner_by_id(partner_id, db)
    if partner:
        partner_dto = PartnerDTO.from_record(partner)
        partner_dict = partner_dto.dict()
        website_links = partner_dict.pop("website_links", [])
        for i, link in enumerate(website_links, start=1):
            partner_dict[f"name_{i}"] = link.get("name")
            partner_dict[f"url_{i}"] = link.get("url")

        return partner_dict
    else:
        return JSONResponse(content={"message": "Partner not found"}, status_code=404)


@router.delete("/{partner_id}/")
async def delete_partner(
    request: Request,
    partner_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Deletes an existing partner
    ---
    tags:
        - partners
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            type: string
            required: true
            default: Token sessionTokenHere==
        - in: header
            name: Accept-Language
            description: Language partner is requesting
            type: string
            required: true
            default: en
        - name: partner_id
            in: path
            description: Partner ID
            required: true
            type: integer
            default: 1
    responses:
        200:
            description: Partner deleted successfully
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        404:
            description: Partner not found
        500:
            description: Internal Server Error
    """
    request_user = await User.get_by_id(user.id, db)
    if request_user.role != 1:
        return JSONResponse(
            content={
                "Error": "Only admin users can manage partners.",
                "SubCode": "OnlyAdminAccess",
            },
            status_code=403,
        )

    try:
        async with db.transaction():
            await PartnerService.delete_partner(partner_id, db)
            return JSONResponse(content={"Success": "Partner deleted"}, status_code=200)
    except PartnerServiceError as e:
        return JSONResponse(content={"message": str(e)}, status_code=404)


@router.put("/{partner_id}/")
async def update_partner(
    request: Request,
    partner_id: int,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Updates an existing partner
    ---
    tags:
        - partners
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            type: string
            required: true
            default: Token sessionTokenHere==
        - in: header
            name: Accept-Language
            description: Language partner is requesting
            type: string
            required: true
            default: en
        - name: partner_id
            in: path
            description: Partner ID
            required: true
            type: integer
        - in: body
            name: body
            required: true
            description: JSON object for updating a Partner
            schema:
            properties:
                name:
                    type: string
                    example: Cool Partner Inc.
                primary_hashtag:
                    type: string
                    example: CoolPartner
                secondary_hashtag:
                    type: string
                    example: CoolPartner,coolProject-*
                link_x:
                    type: string
                    example: https://x.com/CoolPartner
                link_meta:
                    type: string
                    example: https://facebook.com/CoolPartner
                link_instagram:
                    type: string
                    example: https://instagram.com/CoolPartner
                current_projects:
                    type: string
                    example: 3425,2134,2643
                permalink:
                    type: string
                    example: cool-partner
                logo_url:
                    type: string
                    example: https://tasks.hotosm.org/assets/img/hot-tm-logo.svg
                website_links:
                    type: array
                    items:
                        type: string
                mapswipe_group_id:
                    type: string
                    example: -NL6WXPOdFyWACqwNU2O
    responses:
        200:
            description: Partner updated successfully
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        404:
            description: Partner not found
        409:
            description: Resource duplication
        500:
            description: Internal Server Error
    """

    request_user = await User.get_by_id(user.id, db)
    if request_user.role != 1:
        return JSONResponse(
            content={
                "Error": "Only admin users can manage partners.",
                "SubCode": "OnlyAdminAccess",
            },
            status_code=403,
        )

    try:
        data = await request.json()
        async with db.transaction():
            updated_partner = await PartnerService.update_partner(partner_id, data, db)
            return updated_partner
    except PartnerServiceError as e:
        return JSONResponse(content={"message": str(e)}, status_code=404)


@router.get("/")
async def list_partners(
    request: Request,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Get all active partners
    ---
    tags:
        - partners
    produces:
        - application/json
    responses:
        200:
            description: All Partners returned successfully
        500:
            description: Internal Server Error
    """

    request_user = await User.get_by_id(user.id, db)
    if request_user.role != 1:
        return JSONResponse(
            content={
                "Error": "Only admin users can manage partners.",
                "SubCode": "OnlyAdminAccess",
            },
            status_code=403,
        )

    partner_ids = await PartnerService.get_all_partners(db)
    partners = []
    for partner_id in partner_ids:
        partner = await PartnerService.get_partner_by_id(partner_id, db)
        partner_dict = PartnerDTO.from_record(partner).dict()
        website_links = partner_dict.pop("website_links", [])
        for i, link in enumerate(website_links, start=1):
            partner_dict[f"name_{i}"] = link.get("name")
            partner_dict[f"url_{i}"] = link.get("url")
        partners.append(partner_dict)

    return partners


@router.post("/")
async def create_partner(
    request: Request,
    db: Database = Depends(get_db),
    user: AuthUserDTO = Depends(login_required),
):
    """
    Creates a new partner
    ---
    tags:
        - partners
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            type: string
            required: true
            default: Token sessionTokenHere==
        - in: header
            name: Accept-Language
            description: Language partner is requesting
            type: string
            required: true
            default: en
        - in: body
            name: body
            required: true
            description: JSON object for creating a new Partner
            schema:
            properties:
                name:
                    type: string
                    required: true
                    example: "American red cross"
                primary_hashtag:
                    type: string
                    required: true
                    example: "#americanredcross"
                logo_url:
                    type: string
                    example: https://tasks.hotosm.org/assets/img/hot-tm-logo.svg
                name:
                    type: string
                    example: Cool Partner Inc.
                primary_hashtag:
                    type: string
                    example: CoolPartner
                secondary_hashtag:
                    type: string
                    example: CoolPartner,coolProject-*
                link_x:
                    type: string
                    example: https://x.com/CoolPartner
                link_meta:
                    type: string
                    example: https://facebook.com/CoolPartner
                link_instagram:
                    type: string
                    example: https://instagram.com/CoolPartner
                current_projects:
                    type: string
                    example: 3425,2134,2643
                permalink:
                    type: string
                    example: cool-partner
                logo_url:
                    type: string
                    example: https://tasks.hotosm.org/assets/img/hot-tm-logo.svg
                website_links:
                    type: array
                    items:
                        type: string
                    default: [
                    ]
                mapswipe_group_id:
                    type: string
                    example: -NL6WXPOdFyWACqwNU2O
    responses:
        201:
            description: New partner created successfully
        401:
            description: Unauthorized - Invalid credentials
        403:
            description: Forbidden
        409:
            description: Resource duplication
        500:
            description: Internal Server Error
    """

    request_user = await User.get_by_id(user.id, db)
    if request_user.role != 1:
        return JSONResponse(
            content={
                "Error": "Only admin users can manage partners.",
                "SubCode": "OnlyAdminAccess",
            },
            status_code=403,
        )

    try:
        data = await request.json()
        if data:
            if data.get("name") is None:
                return JSONResponse(
                    content={"message": "Partner name is not provided"}, status_code=400
                )

            if data.get("primary_hashtag") is None:
                return JSONResponse(
                    content={"message": "Partner primary_hashtag is not provided"},
                    status_code=400,
                )
            async with db.transaction():
                new_partner_id = await PartnerService.create_partner(data, db)
            partner_data = await PartnerService.get_partner_by_id(new_partner_id, db)
            return partner_data

        else:
            return JSONResponse(
                content={"message": "Data not provided"}, status_code=400
            )
    except PartnerServiceError as e:
        return JSONResponse(content={"message": str(e)}, status_code=500)


@router.get("/{permalink:str}/")
async def get_partner(
    request: Request,
    permalink: str,
    db: Database = Depends(get_db),
):
    """
    Get partner by permalink
    ---
    tags:
        - partners
    produces:
        - application/json
    parameters:
        - in: header
            name: Authorization
            description: Base64 encoded session token
            required: true
            type: string
            default: Token sessionTokenHere==
        - name: permalink
            in: path
            description: The permalink of the partner
            required: true
            type: string
    responses:
        200:
            description: Partner found
        401:
            description: Unauthorized - Invalid credentials
        404:
            description: Partner not found
        500:
            description: Internal Server Error
    """
    try:
        partner_record = await PartnerService.get_partner_by_permalink(permalink, db)
        if not partner_record:
            return JSONResponse(
                content={"message": "Partner not found"}, status_code=404
            )

        partner = dict(partner_record)
        website_links = json.loads(partner.get("website_links", "[]"))
        for i, link in enumerate(website_links, start=1):
            partner[f"name_{i}"] = link["name"]
            partner[f"url_{i}"] = link["url"]

        partner.pop("website_links", None)
        return partner
    except Exception as e:
        return JSONResponse(content={"message": str(e)}, status_code=500)
