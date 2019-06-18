import re
import time

from cachetools import TTLCache, cached
from typing import List
from flask import current_app
from server.models.postgis.utils import NotFound
from server import create_app, db
from server.models.dtos.campaign_dto import CampaignDTO, CampaignProjectDTO, CampaignListDTO
from server.models.postgis.campaign import Campaign, campaign_projects
from server.models.postgis.project import Project


class CampaignService:

    @staticmethod
    def get_campaign(campaign_id: int) -> Campaign:
        """ Gets the specified campaign """
        campaign = Campaign.query.get(campaign_id)

        if campaign is None:
            raise NotFound()

        return campaign

    @staticmethod
    def get_campaign_as_dto(campaign_id: int):
        """ Gets the specified campaign """
        campaign = CampaignService.get_campaign(campaign_id)

        return campaign.as_dto()

    @staticmethod
    def get_project_campaigns_as_dto(project_id: int):
        """ Gets all the campaigns for a specified project """
        query = db.session.query(Campaign.id, Campaign.name)\
            .join(campaign_projects).filter(campaign_projects.c.project_id==project_id)
        campaign_dto = CampaignListDTO()
        campaign_dto.campaigns = {} 
        for r in query:
            str(r[0])
            campaign_dto.campaigns.update({r[0]:r[1]})
        return campaign_dto

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
    def get_all_campaigns():
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
        statement = campaign_projects.insert().values(campaign_id=dto.campaign_id, project_id=dto.project_id)
        db.session.execute(statement)
        db.session.commit()
        new_campaigns = CampaignService.get_project_campaigns_as_dto(dto.project_id)
        return new_campaigns

    @staticmethod
    def update_campaign(campaign_dto: CampaignDTO, campaign_id: int):
        # campaign = Campaign.from_dto(campaign_dto)
        campaign = Campaign.query.get(campaign_id)
        campaign.update(campaign_dto)
        return campaign

