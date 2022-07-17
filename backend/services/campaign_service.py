from backend import db
from flask import current_app
from sqlalchemy.exc import IntegrityError
from psycopg2.errors import UniqueViolation, NotNullViolation
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
from backend.models.postgis.utils import NotFound
from backend.models.postgis.project import Project
from backend.models.postgis.organisation import Organisation
from backend.services.organisation_service import OrganisationService


class CampaignService:
    @staticmethod
    def get_campaign(campaign_id: int) -> Campaign:
        """Gets the specified campaign"""
        campaign = Campaign.query.get(campaign_id)

        if campaign is None:
            raise NotFound()

        return campaign

    @staticmethod
    def get_campaign_by_name(campaign_name: str) -> Campaign:
        campaign = Campaign.query.filter_by(name=campaign_name).first()

        if campaign is None:
            raise NotFound()

        return campaign

    @staticmethod
    def delete_campaign(campaign_id: int):
        """Delete campaign for a project"""
        campaign = Campaign.query.get(campaign_id)
        campaign.delete()
        campaign.save()

    @staticmethod
    def get_campaign_as_dto(campaign_id: int, user_id: int):
        """Gets the specified campaign"""
        campaign = CampaignService.get_campaign(campaign_id)

        campaign_dto = CampaignDTO()
        campaign_dto.id = campaign.id
        campaign_dto.url = campaign.url
        campaign_dto.name = campaign.name
        campaign_dto.logo = campaign.logo
        campaign_dto.description = campaign.description

        return campaign_dto

    @staticmethod
    def get_project_campaigns_as_dto(project_id: int) -> CampaignListDTO:
        """Gets all the campaigns for a specified project"""
        query = (
            Campaign.query.join(campaign_projects)
            .filter(campaign_projects.c.project_id == project_id)
            .all()
        )

        return Campaign.campaign_list_as_dto(query)

    @staticmethod
    def delete_project_campaign(project_id: int, campaign_id: int):
        """Delete campaign for a project"""
        campaign = Campaign.query.get(campaign_id)
        project = Project.query.get(project_id)
        project.campaign.remove(campaign)
        db.session.commit()
        new_campaigns = CampaignService.get_project_campaigns_as_dto(project_id)
        return new_campaigns

    @staticmethod
    def get_all_campaigns() -> CampaignListDTO:
        """Returns a list of all campaigns"""
        query = Campaign.query.order_by(Campaign.name).distinct()

        return Campaign.campaign_list_as_dto(query)

    @staticmethod
    def create_campaign(campaign_dto: NewCampaignDTO):
        """Creates a new campaign"""
        campaign = Campaign.from_dto(campaign_dto)
        try:
            campaign.create()
            if campaign_dto.organisations:
                for org_id in campaign_dto.organisations:
                    organisation = OrganisationService.get_organisation_by_id(org_id)
                    campaign.organisation.append(organisation)
                db.session.commit()
        except IntegrityError as e:
            current_app.logger.info("Integrity error: {}".format(e.args[0]))
            if isinstance(e.orig, UniqueViolation):
                raise ValueError("NameExists- Campaign name already exists") from e
            if isinstance(e.orig, NotNullViolation):
                raise ValueError("NullName- Campaign name cannot be null") from e
        return campaign

    @staticmethod
    def create_campaign_project(dto: CampaignProjectDTO):
        """Assign a campaign with a project"""
        statement = campaign_projects.insert().values(
            campaign_id=dto.campaign_id, project_id=dto.project_id
        )
        db.session.execute(statement)
        db.session.commit()
        new_campaigns = CampaignService.get_project_campaigns_as_dto(dto.project_id)
        return new_campaigns

    @staticmethod
    def create_campaign_organisation(organisation_id: int, campaign_id: int):
        """Creates new campaign from DTO"""
        statement = campaign_organisations.insert().values(
            campaign_id=campaign_id, organisation_id=organisation_id
        )
        db.session.execute(statement)
        db.session.commit()
        new_campaigns = CampaignService.get_organisation_campaigns_as_dto(
            organisation_id
        )
        return new_campaigns

    @staticmethod
    def get_organisation_campaigns_as_dto(organisation_id: int) -> CampaignListDTO:
        """Gets all the campaigns for a specified project"""
        query = (
            Campaign.query.join(campaign_organisations)
            .filter(campaign_organisations.c.organisation_id == organisation_id)
            .all()
        )
        return Campaign.campaign_list_as_dto(query)

    @staticmethod
    def campaign_organisation_exists(campaign_id: int, org_id: int):
        return (
            Campaign.query.join(campaign_organisations)
            .filter(
                campaign_organisations.c.organisation_id == org_id,
                campaign_organisations.c.campaign_id == campaign_id,
            )
            .one_or_none()
        )

    @staticmethod
    def delete_organisation_campaign(organisation_id: int, campaign_id: int):
        """Delete campaign for a organisation"""
        campaign = Campaign.query.get(campaign_id)
        org = Organisation.query.get(organisation_id)
        try:
            org.campaign.remove(campaign)
        except ValueError:
            raise NotFound()
        db.session.commit()
        new_campaigns = CampaignService.get_organisation_campaigns_as_dto(
            organisation_id
        )
        return new_campaigns

    @staticmethod
    def update_campaign(campaign_dto: CampaignDTO, campaign_id: int):
        campaign = Campaign.query.get(campaign_id)
        if not campaign:
            raise NotFound(f"Campaign id {campaign_id} not found")
        try:
            campaign.update(campaign_dto)
        except IntegrityError as e:
            current_app.logger.info("Integrity error: {}".format(e.args[0]))
            raise ValueError()

        return campaign
