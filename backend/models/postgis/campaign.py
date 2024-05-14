from backend import db
from backend.models.dtos.campaign_dto import CampaignDTO, CampaignListDTO


campaign_projects = db.Table(
    "campaign_projects",
    db.metadata,
    db.Column("campaign_id", db.Integer, db.ForeignKey("campaigns.id")),
    db.Column("project_id", db.Integer, db.ForeignKey("projects.id")),
)

campaign_organisations = db.Table(
    "campaign_organisations",
    db.metadata,
    db.Column("campaign_id", db.Integer, db.ForeignKey("campaigns.id")),
    db.Column("organisation_id", db.Integer, db.ForeignKey("organisations.id")),
    db.UniqueConstraint(
        "campaign_id", "organisation_id", name="campaign_organisation_key"
    ),
)


class Campaign(db.Model):
    """Describes an Campaign"""

    __tablename__ = "campaigns"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False, unique=True)
    logo = db.Column(db.String)
    url = db.Column(db.String)
    description = db.Column(db.String)

    def create(self):
        """Creates and saves the current model to the DB"""
        db.session.add(self)
        db.session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        db.session.delete(self)
        db.session.commit()

    def save(self):
        db.session.commit()

    def update(self, dto: CampaignDTO):
        """Update the user details"""
        self.name = dto.name if dto.name else self.name
        self.logo = dto.logo if dto.logo else self.logo
        self.url = dto.url if dto.url else self.url
        self.description = dto.description if dto.description else self.description
        db.session.commit()

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
            campaign_dto = CampaignDTO()
            campaign_dto.id = campaign.id
            campaign_dto.name = campaign.name

            campaign_list_dto.campaigns.append(campaign_dto)

        return campaign_list_dto
