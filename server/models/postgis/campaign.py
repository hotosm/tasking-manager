from server import db
from server.models.dtos.campaign_dto import CampaignDTO, CampaignListDTO


campaign_projects = db.Table(
    "campaign_projects",
    db.metadata,
    db.Column("campaign_id", db.Integer, db.ForeignKey("campaign.id")),
    db.Column("project_id", db.Integer, db.ForeignKey("projects.id")),
)

campaign_organisations = db.Table(
    "campaign_organisations",
    db.metadata,
    db.Column("campaign_id", db.Integer, db.ForeignKey("campaign.id")),
    db.Column("organisation_id", db.Integer, db.ForeignKey("organisations.id")),
)


class Campaign(db.Model):
    """ Describes an Campaign"""

    __tablename__ = "campaign"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    logo = db.Column(db.String)
    url = db.Column(db.String)
    description = db.Column(db.String)

    def create(self):
        """ Creates and saves the current model to the DB """
        db.session.add(self)
        db.session.commit()

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()

    def save(self):
        db.session.commit()

    def update(self, dto: CampaignDTO):
        """ Update the user details """
        self.name = dto.name if dto.name else self.name
        self.logo = dto.logo if dto.logo else self.logo
        self.url = dto.url if dto.url else self.url
        self.description = dto.description if dto.description else self.description
        db.session.commit()

    @staticmethod
    def get_all_campaigns() -> CampaignListDTO:
        query = Campaign.query.distinct()
        campaign_list_dto = CampaignListDTO()
        for campaign in query:
            campaign_dto = CampaignDTO()
            campaign_dto.id = campaign.id
            campaign_dto.name = campaign.name

            campaign_list_dto.campaigns.append(campaign_dto)

        return campaign_list_dto

    @staticmethod
    def get_project_campaigns_as_dto(project_id: int) -> CampaignListDTO:

        query = (
            Campaign.query.join(campaign_projects)
            .filter(campaign_projects.c.project_id == project_id)
            .all()
        )
        campaign_list_dto = CampaignListDTO()
        for campaign in query:
            campaign_dto = CampaignDTO()
            campaign_dto.id = campaign.id
            campaign_dto.name = campaign.name

            campaign_list_dto.campaigns.append(campaign_dto)

        return campaign_list_dto

    @staticmethod
    def get_organisation_campaigns_as_dto(org_id: int) -> CampaignListDTO:

        query = (
            Campaign.query.join(campaign_organisations)
            .filter(campaign_organisations.c.organisation_id == org_id)
            .all()
        )
        campaign_list_dto = CampaignListDTO()
        for campaign in query:
            campaign_dto = CampaignDTO()
            campaign_dto.id = campaign.id
            campaign_dto.name = campaign.name

            campaign_list_dto.campaigns.append(campaign_dto)

        return campaign_list_dto

    @classmethod
    def from_dto(cls, dto: CampaignDTO):
        """ Creates new message from DTO """
        campaign = cls()
        campaign.url = dto.url
        campaign.name = dto.name
        campaign.logo = dto.logo
        campaign.description = dto.description

        return campaign

    def as_dto(self) -> CampaignDTO:
        """ Creates new message from DTO """
        campaign_dto = CampaignDTO()
        campaign_dto.id = self.id
        campaign_dto.url = self.url
        campaign_dto.name = self.name
        campaign_dto.logo = self.logo
        campaign_dto.description = self.description

        return campaign_dto
