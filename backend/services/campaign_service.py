from backend import db
# from flask import current_app
from sqlalchemy.exc import IntegrityError
# from psycopg2.errors import UniqueViolation, NotNullViolation

from backend.exceptions import NotFound
from backend.models.dtos.campaign_dto import (
    CampaignDTO,
    NewCampaignDTO,
    CampaignProjectDTO,
    CampaignListDTO,
)
from backend.models.postgis.campaign import (
    Campaign,
    campaign_projects,
    campaign_organisations,
)
from backend.models.postgis.organisation import Organisation
from backend.services.organisation_service import OrganisationService
from backend.services.project_service import ProjectService
from backend.db import get_session
session = get_session()
from sqlalchemy import select
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert
from databases import Database
from fastapi import HTTPException


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
            await db.execute(query=query_delete_orgs, values={"campaign_id": campaign_id})

            query_delete_campaign = """
            DELETE FROM campaigns
            WHERE id = :campaign_id
            """
            await db.execute(query=query_delete_campaign, values={"campaign_id": campaign_id})


    @staticmethod
    async def get_campaign_as_dto(campaign_id: int, db) -> CampaignDTO:
        """Gets the specified campaign"""
        campaign = await CampaignService.get_campaign(campaign_id, db)
        return campaign


    @staticmethod
    async def get_project_campaigns_as_dto(project_id: int, session: AsyncSession) -> CampaignListDTO:
        """Gets all the campaigns for a specified project"""
        
        # Test if project exists
        await ProjectService.get_project_by_id(project_id, session)
        
        # Construct the query
        query = (
            select(Campaign)
            .join(campaign_projects)
            .filter(campaign_projects.c.project_id == project_id)
        )
        
        # Execute the query asynchronously
        result = await session.execute(query)
        campaigns = result.scalars().all()
        
        # Convert the result to DTO
        return Campaign.campaign_list_as_dto(campaigns)

    @staticmethod
    async def delete_project_campaign(project_id: int, campaign_id: int, session):
        """Delete campaign for a project"""
        campaign = await CampaignService.get_campaign(campaign_id, session)
        project = await ProjectService.get_project_by_id(project_id, session)
        project_campaigns = await CampaignService.get_project_campaigns_as_dto(project_id, session)
        project_campaigns = project_campaigns.dict()
        if campaign.id not in [i["id"] for i in project_campaigns["campaigns"]]:
            raise NotFound(
                sub_code="PROJECT_CAMPAIGN_NOT_FOUND",
                campaign_id=campaign_id,
                project_id=project_id,
            )
        await session.refresh(project, ["campaign"])
        project.campaign.remove(campaign)
        await session.commit()
        new_campaigns = await CampaignService.get_project_campaigns_as_dto(project_id, session)
        return new_campaigns


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
                        organisation = await OrganisationService.get_organisation_by_id(org_id, db)
                        if organisation:
                            org_query = """
                                INSERT INTO campaign_organisations (campaign_id, organisation_id)
                                VALUES (:campaign_id, :organisation_id)
                            """
                            await db.execute(org_query, {"campaign_id": campaign_id, "organisation_id": org_id})

                return campaign_id
        except Exception as e:
                raise HTTPException(
                    status_code=500, detail="Failed to create campaign."
                ) from e

    @staticmethod
    def create_campaign_project(dto: CampaignProjectDTO):
        """Assign a campaign with a project"""
        ProjectService.get_project_by_id(dto.project_id)
        CampaignService.get_campaign(dto.campaign_id)
        statement = campaign_projects.insert().values(
            campaign_id=dto.campaign_id, project_id=dto.project_id
        )
        session.execute(statement)
        session.commit()
        new_campaigns = CampaignService.get_project_campaigns_as_dto(dto.project_id)
        return new_campaigns

    @staticmethod
    async def create_campaign_organisation(organisation_id: int, campaign_id: int, session):
        """Creates new campaign from DTO"""
        # Check if campaign exists
        await CampaignService.get_campaign(campaign_id)
        # Check if organisation exists
        await OrganisationService.get_organisation_by_id(organisation_id)

        statement = insert(campaign_organisations).values(
            campaign_id=campaign_id, organisation_id=organisation_id
        )
        await session.execute(statement)
        await session.commit()

        new_campaigns = await CampaignService.get_organisation_campaigns_as_dto(organisation_id)
        return new_campaigns

    @staticmethod
    async def get_organisation_campaigns_as_dto(organisation_id: int, session: AsyncSession) -> CampaignListDTO:
        """Gets all the campaigns for a specified project"""
        
        # Check if organisation exists
        await OrganisationService.get_organisation_by_id(organisation_id, session)
        
        query = (
            select(Campaign)
            .join(campaign_organisations)
            .filter(campaign_organisations.c.organisation_id == organisation_id)
        )
        
        result = await session.execute(query)
        campaigns = result.scalars().all()
        
        return await Campaign.campaign_list_as_dto(campaigns)
    
    @staticmethod
    async def campaign_organisation_exists(campaign_id: int, org_id: int, session):
        result = await session.execute(
            select(Campaign)
            .join(campaign_organisations)
            .filter(
                campaign_organisations.c.organisation_id == org_id,
                campaign_organisations.c.campaign_id == campaign_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    def delete_organisation_campaign(organisation_id: int, campaign_id: int):
        """Delete campaign for a organisation"""
        campaign = session.get(Campaign, campaign_id)
        if not campaign:
            raise NotFound(sub_code="CAMPAIGN_NOT_FOUND", campaign_id=campaign_id)
        org = session.get(Organisation, organisation_id)
        if not org:
            raise NotFound(
                sub_code="ORGANISATION_NOT_FOUND", organisation_id=organisation_id
            )
        if not CampaignService.campaign_organisation_exists(
            campaign_id, organisation_id
        ):
            raise NotFound(
                sub_code="ORGANISATION_CAMPAIGN_NOT_FOUND",
                organisation_id=organisation_id,
                campaign_id=campaign_id,
            )
        org.campaign.remove(campaign)
        session.commit()
        new_campaigns = CampaignService.get_organisation_campaigns_as_dto(
            organisation_id
        )
        return new_campaigns

    @staticmethod
    async def delete_organisation_campaign(organisation_id: int, campaign_id: int, session):
        """Delete campaign for an organisation"""
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            raise NotFound(sub_code="CAMPAIGN_NOT_FOUND", campaign_id=campaign_id)
        
        org = await session.get(Organisation, organisation_id)
        if not org:
            raise NotFound(sub_code="ORGANISATION_NOT_FOUND", organisation_id=organisation_id)
        
        campaign_org_exists = await CampaignService.campaign_organisation_exists(campaign_id, organisation_id, session)
        if not campaign_org_exists:
            raise NotFound(
                sub_code="ORGANISATION_CAMPAIGN_NOT_FOUND",
                organisation_id=organisation_id,
                campaign_id=campaign_id,
            )
        await session.refresh(org, ["campaign"])
        org.campaign.remove(campaign)
        await session.commit()


    @staticmethod
    async def update_campaign(campaign_dto: CampaignDTO, campaign_id: int, db: Database):
        campaign_query = "SELECT * FROM campaigns WHERE id = :id"
        campaign = await db.fetch_one(query=campaign_query, values={"id": campaign_id})

        if not campaign:
            raise NotFound(sub_code="CAMPAIGN_NOT_FOUND", campaign_id=campaign_id)
        try:
            # Convert the DTO to a dictionary, excluding unset fields
            campaign_dict = campaign_dto.dict(exclude_unset=True)
            # Remove 'organisation' key if it exists
            if 'organisations' in campaign_dict:
                del campaign_dict['organisations']

            set_clause = ", ".join(f"{key} = :{key}" for key in campaign_dict.keys())
            update_query = f"""
            UPDATE campaigns
            SET {set_clause}
            WHERE id = :id
            RETURNING id
            """
            campaign = await db.fetch_one(query=update_query, values={**campaign_dict, 'id': campaign_id})
            if not campaign:
                raise HTTPException(status_code=404, detail="Campaign not found")

            return campaign

        except IntegrityError:
            raise HTTPException(status_code=409, detail="Campaign name already exists")

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) from e