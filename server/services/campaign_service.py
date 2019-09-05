from server.models.postgis.utils import NotFound
from server import db
from server.models.dtos.campaign_dto import (
    CampaignDTO,
    CampaignProjectDTO,
    CampaignListDTO,
    CampaignOrganisationDTO,
)
from server.models.postgis.campaign import (
    Campaign,
    campaign_projects,
    campaign_organisations,
)
from server.models.postgis.project import Project
from server.models.postgis.organisation import Organisation
from server.models.postgis.statuses import OrganisationVisibility
from server.services.organisation_service import OrganisationService
from server.models.dtos.organisation_dto import OrganisationDTO


class CampaignService:
    @staticmethod
    def get_campaign(campaign_id: int) -> Campaign:
        """ Gets the specified campaign """
        campaign = Campaign.query.get(campaign_id)

        if campaign is None:
            raise NotFound()

        return campaign

    @staticmethod
    def delete_campaign(campaign_id: int):
        """ Delete campaign for a project"""
        campaign = Campaign.query.get(campaign_id)
        campaign.delete()
        campaign.save()

    @staticmethod
    def get_campaign_as_dto(campaign_id: int, user_id: int):
        """ Gets the specified campaign """
        campaign = CampaignService.get_campaign(campaign_id)
        campaign_dto = CampaignDTO()
        campaign_dto.id = campaign.id
        campaign_dto.url = campaign.url
        campaign_dto.name = campaign.name
        campaign_dto.logo = campaign.logo
        campaign_dto.description = campaign.description
        campaign_dto.organisations = []

        orgs = (
            Organisation.query.join(campaign_organisations)
            .filter(campaign_organisations.c.campaign_id == campaign.id)
            .all()
        )

        for org in orgs:
            if user_id != 0:
                logged_in = OrganisationService.user_is_admin(org.id, user_id)
            else:
                logged_in = False
            if org.visibility != OrganisationVisibility.SECRET.value or logged_in:
                org_dto = OrganisationDTO()
                print(org.name)
                org_dto.projects = []

                org_dto.organisation_id = org.id
                org_dto.name = org.name
                org_dto.logo = org.logo
                org_dto.url = org.url
                org_dto.visibility = org.visibility
                org_dto.is_admin = logged_in
                projects = OrganisationService.get_projects_by_organisation_id(org.id)
                for project in projects:
                    org_dto.projects.append(project.name)

                campaign_dto.organisations.append(org_dto)
        return campaign_dto

    @staticmethod
    def get_project_campaigns_as_dto(project_id: int) -> CampaignListDTO:
        """ Gets all the campaigns for a specified project """

        return Campaign.get_project_campaigns_as_dto(project_id)

    @staticmethod
    def delete_project_campaign(project_id: int, campaign_id: int):
        """ Delete campaign for a project"""
        campaign = Campaign.query.get(campaign_id)
        project = Project.query.get(project_id)
        project.campaign.remove(campaign)
        db.session.commit()
        new_campaigns = CampaignService.get_project_campaigns_as_dto(project_id)
        return new_campaigns

    @staticmethod
    def get_all_campaigns() -> CampaignListDTO:
        """ Get all campaign tags"""
        return Campaign.get_all_campaigns()

    @staticmethod
    def create_campaign(campaign_dto: CampaignDTO):
        campaign = Campaign.from_dto(campaign_dto)
        campaign.create()
        return campaign

    @staticmethod
    def create_campaign_project(dto: CampaignProjectDTO):
        """ Creates new message from DTO """
        statement = campaign_projects.insert().values(
            campaign_id=dto.campaign_id, project_id=dto.project_id
        )
        db.session.execute(statement)
        db.session.commit()
        new_campaigns = CampaignService.get_organisation_campaigns_as_dto(
            dto.project_id
        )
        return new_campaigns

    @staticmethod
    def create_campaign_organisation(dto: CampaignOrganisationDTO):
        """ Creates new message from DTO """
        statement = campaign_organisations.insert().values(
            campaign_id=dto.campaign_id, organisation_id=dto.organisation_id
        )
        db.session.execute(statement)
        db.session.commit()
        new_campaigns = CampaignService.get_organisation_campaigns_as_dto(
            dto.organisation_id
        )
        return new_campaigns

    @staticmethod
    def get_organisation_campaigns_as_dto(organisation_id: int) -> CampaignListDTO:
        """ Gets all the campaigns for a specified project """

        return Campaign.get_organisation_campaigns_as_dto(organisation_id)

    @staticmethod
    def delete_organisation_campaign(organisation_id: int, campaign_id: int):
        """ Delete campaign for a project"""
        campaign = Campaign.query.get(campaign_id)
        org = Organisation.query.get(organisation_id)
        org.campaign.remove(campaign)
        db.session.commit()
        new_campaigns = CampaignService.get_organisation_campaigns_as_dto(
            organisation_id
        )
        return new_campaigns

    @staticmethod
    def update_campaign(campaign_dto: CampaignDTO, campaign_id: int):
        # campaign = Campaign.from_dto(campaign_dto)
        campaign = Campaign.query.get(campaign_id)
        campaign.update(campaign_dto)
        return campaign
