from backend import db
from flask import current_app
from sqlalchemy.exc import IntegrityError
from psycopg2.errors import UniqueViolation, NotNullViolation

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


class CampaignService:
    @staticmethod
    def get_campaign(campaign_id: int) -> Campaign:
        """Gets the specified campaign"""
        campaign = db.session.get(Campaign, campaign_id)

        if campaign is None:
            raise NotFound(sub_code="CAMPAIGN_NOT_FOUND", campaign_id=campaign_id)

        return campaign

    @staticmethod
    def get_campaign_by_name(campaign_name: str) -> Campaign:
        campaign = Campaign.query.filter_by(name=campaign_name).first()

        if campaign is None:
            raise NotFound(sub_code="CAMPAIGN_NOT_FOUND", campaign_name=campaign_name)

        return campaign

    @staticmethod
    def delete_campaign(campaign_id: int):
        """Delete campaign for a project"""
        campaign = db.session.get(Campaign, campaign_id)
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
        # Test if project exists
        ProjectService.get_project_by_id(project_id)
        query = (
            Campaign.query.join(campaign_projects)
            .filter(campaign_projects.c.project_id == project_id)
            .all()
        )

        return Campaign.campaign_list_as_dto(query)

    @staticmethod
    def delete_project_campaign(project_id: int, campaign_id: int):
        """Delete campaign for a project"""
        campaign = CampaignService.get_campaign(campaign_id)
        project = ProjectService.get_project_by_id(project_id)
        project_campaigns = CampaignService.get_project_campaigns_as_dto(project_id)
        if campaign.id not in [i["id"] for i in project_campaigns["campaigns"]]:
            raise NotFound(
                sub_code="PROJECT_CAMPAIGN_NOT_FOUND",
                campaign_id=campaign_id,
                project_id=project_id,
            )
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
        ProjectService.get_project_by_id(dto.project_id)
        CampaignService.get_campaign(dto.campaign_id)
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
        # Check if campaign exists
        CampaignService.get_campaign(campaign_id)
        # Check if organisation exists
        OrganisationService.get_organisation_by_id(organisation_id)

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
        # Check if organisation exists
        OrganisationService.get_organisation_by_id(organisation_id)
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
        campaign = db.session.get(Campaign, campaign_id)
        if not campaign:
            raise NotFound(sub_code="CAMPAIGN_NOT_FOUND", campaign_id=campaign_id)
        org = db.session.get(Organisation, organisation_id)
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
        db.session.commit()
        new_campaigns = CampaignService.get_organisation_campaigns_as_dto(
            organisation_id
        )
        return new_campaigns

    @staticmethod
    def update_campaign(campaign_dto: CampaignDTO, campaign_id: int):
        campaign = db.session.get(Campaign, campaign_id)
        if not campaign:
            raise NotFound(sub_code="CAMPAIGN_NOT_FOUND", campaign_id=campaign_id)
        try:
            campaign.update(campaign_dto)
        except IntegrityError as e:
            current_app.logger.info("Integrity error: {}".format(e.args[0]))
            raise ValueError()

        return campaign
