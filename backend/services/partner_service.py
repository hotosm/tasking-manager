import json

from databases import Database
from fastapi.responses import JSONResponse
from loguru import logger

from backend.models.dtos.partner_dto import PartnerDTO
from backend.models.postgis.partner import Partner


class PartnerServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling partners"""

    def __init__(self, message):
        logger.debug(message)


class PartnerService:
    @staticmethod
    async def get_partner_by_id(partner_id: int, db: Database):
        return await Partner.get_by_id(partner_id, db)

    @staticmethod
    async def get_partner_by_permalink(permalink: str, db: Database) -> Partner:
        return await Partner.get_by_permalink(permalink, db)

    @staticmethod
    async def create_partner(data, db: Database) -> int:
        """Create a new partner in the database"""
        website_links = []
        for i in range(1, 6):
            name_key = f"name_{i}"
            url_key = f"url_{i}"
            name = data.get(name_key)
            url = data.get(url_key)
            if name and url:
                website_links.append({"name": name, "url": url})

        query = """
            INSERT INTO partners (
                name, primary_hashtag, secondary_hashtag, logo_url, link_meta,
                link_x, link_instagram, current_projects, permalink,
                website_links, mapswipe_group_id
            ) VALUES (
                :name, :primary_hashtag, :secondary_hashtag, :logo_url, :link_meta,
                :link_x, :link_instagram, :current_projects, :permalink,
                :website_links, :mapswipe_group_id
            ) RETURNING id
        """

        values = {
            "name": data.get("name"),
            "primary_hashtag": data.get("primary_hashtag"),
            "secondary_hashtag": data.get("secondary_hashtag"),
            "logo_url": data.get("logo_url"),
            "link_meta": data.get("link_meta"),
            "link_x": data.get("link_x"),
            "link_instagram": data.get("link_instagram"),
            "current_projects": data.get("current_projects"),
            "permalink": data.get("permalink"),
            "website_links": json.dumps(website_links),
            "mapswipe_group_id": data.get("mapswipe_group_id"),
        }

        new_partner_id = await db.execute(query, values)
        return new_partner_id

    @staticmethod
    async def delete_partner(partner_id: int, db: Database):
        partner = await Partner.get_by_id(partner_id, db)
        if partner:
            delete_partner_query = """
                DELETE FROM partners WHERE id = :partner_id
            """
            await db.execute(delete_partner_query, {"partner_id": partner_id})
            return JSONResponse(content={"Success": "Team deleted"}, status_code=200)
        else:
            return JSONResponse(
                content={"Error": "Partner cannot be deleted"}, status_code=400
            )

    @staticmethod
    async def update_partner(partner_id: int, data: dict, db: Database) -> dict:
        await Partner.get_by_id(partner_id, db)
        # Handle dynamic website links from name_* and url_*
        website_links = []
        for key, value in data.items():
            if key.startswith("name_"):
                index = key.split("_")[1]
                url_key = f"url_{index}"
                if url_key in data and value.strip():
                    website_links.append({"name": value, "url": data[url_key]})

        set_clauses = []
        params = {"partner_id": partner_id}

        for key, value in data.items():
            # Exclude name_* and url_* fields from direct update
            if key.startswith("name_") or key.startswith("url_"):
                continue
            set_clauses.append(f"{key} = :{key}")
            params[key] = value

        if website_links:
            set_clauses.append("website_links = :website_links")
            params["website_links"] = json.dumps(website_links)

        set_clause = ", ".join(set_clauses)
        query = f"""
        UPDATE partners
        SET {set_clause}
        WHERE id = :partner_id
        RETURNING *
        """

        updated_partner = await db.fetch_one(query, params)
        if not updated_partner:
            raise PartnerServiceError(f"Failed to update Partner with ID {partner_id}.")
        partner_dict = dict(updated_partner)
        if "website_links" in partner_dict and partner_dict["website_links"]:
            partner_dict["website_links"] = json.loads(partner_dict["website_links"])
        return partner_dict

    @staticmethod
    def get_partner_dto_by_id(partner: int, request_partner: int) -> PartnerDTO:
        partner = PartnerService.get_partner_by_id(partner)
        if request_partner:
            request_name = PartnerService.get_partner_by_id(request_partner).name
            return partner.as_dto(request_name)
        return partner.as_dto()

    @staticmethod
    async def get_all_partners(db: Database):
        """Get all partners"""
        return await Partner.get_all_partners(db)
