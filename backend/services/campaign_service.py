# from flask import current_app
# from psycopg2.errors import UniqueViolation, NotNullViolation
from databases import Database
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from backend.db import get_session
from backend.exceptions import NotFound
from backend.models.dtos.campaign_dto import (
    CampaignDTO,
    CampaignListDTO,
    CampaignProjectDTO,
    NewCampaignDTO,
)
from backend.models.postgis.campaign import Campaign
from backend.services.organisation_service import OrganisationService
from backend.services.project_service import ProjectService

session = get_session()


class CampaignService:
    @staticmethod
    async def get_campaign(campaign_id: int, db: Database) -> CampaignDTO:
        """Gets the specified campaign by its ID"""
        query = """
        SELECT id, name, logo, url, description
        FROM campaigns
        WHERE id = :campaign_id
        """
        row = await db.fetch_one(query=query, values={"campaign_id": campaign_id})

        if row is None:
            raise NotFound(sub_code="CAMPAIGN_NOT_FOUND", campaign_id=campaign_id)

        return CampaignDTO(**row)

    @staticmethod
    async def get_campaign_by_name(campaign_name: str, db: Database) -> CampaignDTO:
        """Gets the specified campaign by its name"""
        query = """
        SELECT id, name, logo, url, description
        FROM campaigns
        WHERE name = :campaign_name
        """
        row = await db.fetch_one(query=query, values={"campaign_name": campaign_name})

        if row is None:
            raise NotFound(sub_code="CAMPAIGN_NOT_FOUND", campaign_name=campaign_name)

        return CampaignDTO(**row)

    @staticmethod
    async def delete_campaign(campaign_id: int, db: Database):
        """Delete a campaign and its related organizations by its ID"""
        # Begin a transaction to ensure both deletions are handled together
        async with db.transaction():
            query_delete_orgs = """
            DELETE FROM campaign_organisations
            WHERE campaign_id = :campaign_id
            """
            await db.execute(
                query=query_delete_orgs, values={"campaign_id": campaign_id}
            )

            query_delete_campaign = """
            DELETE FROM campaigns
            WHERE id = :campaign_id
            """
            await db.execute(
                query=query_delete_campaign, values={"campaign_id": campaign_id}
            )

    @staticmethod
    async def get_campaign_as_dto(campaign_id: int, db) -> CampaignDTO:
        """Gets the specified campaign"""
        campaign = await CampaignService.get_campaign(campaign_id, db)
        return campaign

    @staticmethod
    async def get_project_campaigns_as_dto(
        project_id: int, db: Database
    ) -> CampaignListDTO:
        """Gets all the campaigns for a specified project"""
        # Test if project exists
        await ProjectService.get_project_by_id(project_id, db)

        query = """
            SELECT c.*
            FROM campaigns c
            INNER JOIN campaign_projects cp ON c.id = cp.campaign_id
            WHERE cp.project_id = :project_id
        """

        campaigns = await db.fetch_all(query=query, values={"project_id": project_id})
        return Campaign.campaign_list_as_dto(campaigns)

    @staticmethod
    async def delete_project_campaign(project_id: int, campaign_id: int, db: Database):
        """Delete campaign from a project."""
        # Check if the campaign exists
        await CampaignService.get_campaign(campaign_id, db)

        # Check if the project exists
        await ProjectService.get_project_by_id(project_id, db)

        """Fetch all campaigns associated with a project."""
        query = """
            SELECT c.id
            FROM campaigns c
            JOIN campaign_projects pc ON c.id = pc.campaign_id
            WHERE pc.project_id = :project_id
        """
        project_campaigns = await db.fetch_all(
            query=query, values={"project_id": project_id}
        )

        if campaign_id not in [campaign.id for campaign in project_campaigns]:
            raise NotFound(
                sub_code="PROJECT_CAMPAIGN_NOT_FOUND",
                campaign_id=campaign_id,
                project_id=project_id,
            )

        # Delete the campaign from the project
        delete_query = """
            DELETE FROM campaign_projects
            WHERE project_id = :project_id
            AND campaign_id = :campaign_id
        """
        await db.execute(
            delete_query, values={"project_id": project_id, "campaign_id": campaign_id}
        )
        # Fetch the updated list of campaigns
        updated_campaigns = await CampaignService.get_project_campaigns_as_dto(
            project_id, db
        )
        return updated_campaigns

    @staticmethod
    async def get_all_campaigns(db: Database) -> CampaignListDTO:
        """Returns a list of all campaigns"""
        # Define the raw SQL query
        query = """
        SELECT DISTINCT id, name
        FROM campaigns
        ORDER BY name
        """
        rows = await db.fetch_all(query)
        return Campaign.campaign_list_as_dto(rows)

    @staticmethod
    async def create_campaign(campaign_dto: NewCampaignDTO, db: Database):
        """Creates a new campaign asynchronously"""
        try:
            async with db.transaction():
                # Generate the base query and values
                query = """
                    INSERT INTO campaigns (name, logo, url, description)
                    VALUES (:name, :logo, :url, :description)
                    RETURNING id
                """
                values = {
                    "name": campaign_dto.name,
                    "logo": campaign_dto.logo,
                    "url": campaign_dto.url,
                    "description": campaign_dto.description,
                }

                campaign_id = await db.execute(query, values)
                if campaign_dto.organisations:
                    for org_id in campaign_dto.organisations:
                        organisation = await OrganisationService.get_organisation_by_id(
                            org_id, db
                        )
                        if organisation:
                            org_query = """
                                INSERT INTO campaign_organisations (campaign_id, organisation_id)
                                VALUES (:campaign_id, :organisation_id)
                            """
                            await db.execute(
                                org_query,
                                {"campaign_id": campaign_id, "organisation_id": org_id},
                            )

                return campaign_id
        except Exception as e:
            raise HTTPException(
                status_code=500, detail="Failed to create campaign."
            ) from e

    @staticmethod
    async def create_campaign_project(
        dto: CampaignProjectDTO, db: Database
    ) -> CampaignListDTO:
        """Assign a campaign to a project"""

        # Check if the project exists
        await ProjectService.get_project_by_id(dto.project_id, db)

        # Check if the campaign exists
        await CampaignService.get_campaign(dto.campaign_id, db)

        insert_query = """
            INSERT INTO campaign_projects (campaign_id, project_id)
            VALUES (:campaign_id, :project_id)
        """

        await db.execute(
            query=insert_query,
            values={"campaign_id": dto.campaign_id, "project_id": dto.project_id},
        )
        new_campaigns = await CampaignService.get_project_campaigns_as_dto(
            dto.project_id, db
        )
        return new_campaigns

    @staticmethod
    async def create_campaign_organisation(
        organisation_id: int, campaign_id: int, db: Database
    ):
        """Creates new campaign organisation from DTO"""
        # Check if campaign exists
        await CampaignService.get_campaign(campaign_id, db)
        # Check if organisation exists
        await OrganisationService.get_organisation_by_id(organisation_id, db)

        query = """
        INSERT INTO campaign_organisations (campaign_id, organisation_id)
        VALUES (:campaign_id, :organisation_id)
        """
        await db.execute(
            query=query,
            values={"campaign_id": campaign_id, "organisation_id": organisation_id},
        )

    @staticmethod
    async def get_organisation_campaigns_as_dto(
        organisation_id: int, database: Database
    ) -> CampaignListDTO:
        """Gets all the campaigns for a specified organisation"""

        # Check if organisation exists
        await OrganisationService.get_organisation_by_id(organisation_id, database)

        query = """
        SELECT c.*
        FROM campaigns c
        JOIN campaign_organisations co ON c.id = co.campaign_id
        WHERE co.organisation_id = :organisation_id
        """
        campaigns = await database.fetch_all(
            query=query, values={"organisation_id": organisation_id}
        )

        # Convert the result to a list of campaign DTOs
        return Campaign.campaign_list_as_dto(campaigns)

    @staticmethod
    async def campaign_organisation_exists(
        campaign_id: int, org_id: int, database: Database
    ) -> bool:
        query = """
        SELECT 1
        FROM campaign_organisations
        WHERE organisation_id = :org_id
        AND campaign_id = :campaign_id
        LIMIT 1
        """
        result = await database.fetch_one(
            query=query, values={"org_id": org_id, "campaign_id": campaign_id}
        )
        return result is not None

    @staticmethod
    async def delete_organisation_campaign(
        organisation_id: int, campaign_id: int, db: Database
    ):
        """Delete campaign for an organisation"""

        # Check if campaign exists
        query_campaign = "SELECT 1 FROM campaigns WHERE id = :campaign_id LIMIT 1"
        campaign_exists = await db.fetch_one(
            query=query_campaign, values={"campaign_id": campaign_id}
        )
        if not campaign_exists:
            raise NotFound(sub_code="CAMPAIGN_NOT_FOUND", campaign_id=campaign_id)

        # Check if organisation exists
        query_org = "SELECT 1 FROM organisations WHERE id = :organisation_id LIMIT 1"
        org_exists = await db.fetch_one(
            query=query_org, values={"organisation_id": organisation_id}
        )
        if not org_exists:
            raise NotFound(
                sub_code="ORGANISATION_NOT_FOUND", organisation_id=organisation_id
            )

        campaign_org_exists = await CampaignService.campaign_organisation_exists(
            campaign_id, organisation_id, db
        )
        if not campaign_org_exists:
            raise NotFound(
                sub_code="ORGANISATION_CAMPAIGN_NOT_FOUND",
                organisation_id=organisation_id,
                campaign_id=campaign_id,
            )

        query_delete = """
        DELETE FROM campaign_organisations
        WHERE campaign_id = :campaign_id
        AND organisation_id = :organisation_id
        """
        await db.execute(
            query=query_delete,
            values={"campaign_id": campaign_id, "organisation_id": organisation_id},
        )

    @staticmethod
    async def update_campaign(
        campaign_dto: CampaignDTO, campaign_id: int, db: Database
    ):
        campaign_query = "SELECT * FROM campaigns WHERE id = :id"
        campaign = await db.fetch_one(query=campaign_query, values={"id": campaign_id})

        if not campaign:
            raise NotFound(sub_code="CAMPAIGN_NOT_FOUND", campaign_id=campaign_id)
        try:
            # Convert the DTO to a dictionary, excluding unset fields
            campaign_dict = campaign_dto.dict(exclude_unset=True)
            # Remove 'organisation' key if it exists
            if "organisations" in campaign_dict:
                del campaign_dict["organisations"]

            set_clause = ", ".join(f"{key} = :{key}" for key in campaign_dict.keys())
            update_query = f"""
            UPDATE campaigns
            SET {set_clause}
            WHERE id = :id
            RETURNING id
            """
            campaign = await db.fetch_one(
                query=update_query, values={**campaign_dict, "id": campaign_id}
            )
            if not campaign:
                raise HTTPException(status_code=404, detail="Campaign not found")

            return campaign

        except IntegrityError:
            raise HTTPException(status_code=409, detail="Campaign name already exists")

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) from e
