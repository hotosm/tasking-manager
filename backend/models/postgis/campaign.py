from sqlalchemy import Column, String, Integer, ForeignKey, Table, UniqueConstraint
from backend.models.dtos.campaign_dto import CampaignDTO, CampaignListDTO
from backend.db import Base, get_session

session = get_session()

campaign_projects = Table(
    "campaign_projects",
    Base.metadata,
    Column("campaign_id", Integer, ForeignKey("campaigns.id")),
    Column("project_id", Integer, ForeignKey("projects.id")),
)

campaign_organisations = Table(
    "campaign_organisations",
    Base.metadata,
    Column("campaign_id", Integer, ForeignKey("campaigns.id")),
    Column("organisation_id", Integer, ForeignKey("organisations.id")),
    UniqueConstraint(
        "campaign_id", "organisation_id", name="campaign_organisation_key"
    ),
)


class Campaign(Base):
    """Describes an Campaign"""

    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    logo = Column(String)
    url = Column(String)
    description = Column(String)

    def create(self):
        """Creates and saves the current model to the DB"""
        session.add(self)
        session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        session.delete(self)
        session.commit()

    def save(self):
        session.commit()

    def update(self, dto: CampaignDTO):
        """Update the user details"""
        self.name = dto.name if dto.name else self.name
        self.logo = dto.logo if dto.logo else self.logo
        self.url = dto.url if dto.url else self.url
        self.description = dto.description if dto.description else self.description
        session.commit()

    @classmethod
    def from_dto(cls, dto: CampaignDTO):
        """Creates new message from DTO"""
        campaign = cls()
        campaign.url = dto.url
        campaign.name = dto.name
        campaign.logo = dto.logo
        campaign.description = dto.description

        return campaign

    def as_dto(self) -> CampaignDTO:
        """Creates new message from DTO"""
        campaign_dto = CampaignDTO()
        campaign_dto.id = self.id
        campaign_dto.url = self.url
        campaign_dto.name = self.name
        campaign_dto.logo = self.logo
        campaign_dto.description = self.description

        return campaign_dto

    @staticmethod
    def campaign_list_as_dto(campaigns: list) -> CampaignListDTO:
        """Converts a collection of campaigns into DTO"""
        campaign_list_dto = CampaignListDTO()
        for campaign in campaigns:
            campaign_dto = CampaignDTO(**campaign)
            campaign_list_dto.campaigns.append(campaign_dto)
        return campaign_list_dto
