from sqlalchemy import or_
from server import db

from server.models.dtos.organisation_dto import OrganisationDTO, NewOrganisationDTO
from server.models.postgis.user import User
from server.models.postgis.campaign import Campaign, campaign_organisations
from server.models.postgis.statuses import OrganisationVisibility
from server.models.postgis.utils import NotFound


# Secondary table defining many-to-many relationship between organisations and admins
organisation_admins = db.Table(
    "organisation_admins",
    db.metadata,
    db.Column(
        "organisation_id", db.Integer, db.ForeignKey("organisations.id"), nullable=False
    ),
    db.Column("user_id", db.BigInteger, db.ForeignKey("users.id"), nullable=False),
)


class Organisation(db.Model):
    """ Describes an Organisation """

    __tablename__ = "organisations"

    # Columns
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(512), nullable=False, unique=True)
    logo = db.Column(db.String)  # URL of a logo
    url = db.Column(db.String)
    visibility = db.Column(
        db.Integer, default=OrganisationVisibility.PUBLIC.value, nullable=False
    )

    admins = db.relationship(
        User, secondary=organisation_admins, backref="organisations"
    )
    campaign = db.relationship(
        Campaign, secondary=campaign_organisations, backref="organisation"
    )

    def create(self):
        """ Creates and saves the current model to the DB """
        db.session.add(self)
        db.session.commit()

    @classmethod
    def create_from_dto(cls, new_organisation_dto: NewOrganisationDTO):
        """ Creates a new organisation from a DTO """
        new_org = cls()

        new_org.name = new_organisation_dto.name
        new_org.logo = new_organisation_dto.logo
        new_org.url = new_organisation_dto.url
        new_org.visibility = OrganisationVisibility[
            new_organisation_dto.visibility
        ].value
        new_org.admins = [
            User().get_by_id(admin) for admin in new_organisation_dto.admins
        ]

        new_org.create()
        return new_org

    def update(self, organisation_dto: OrganisationDTO):
        """ Updates Organisation from DTO """
        self.name = organisation_dto.name
        self.logo = organisation_dto.logo
        self.url = organisation_dto.url
        self.visibility = OrganisationVisibility[organisation_dto.visibility].value

        self.admins = []
        # Need to handle this in the loop so we can take care of NotFound users
        for admin in organisation_dto.admins:
            new_admin = User().get_by_username(admin)
            if new_admin is None:
                raise NotFound(f"User {admin} Not Found")
            self.admins.append(new_admin)

        db.session.commit()

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()

    def can_be_deleted(self) -> bool:
        """ An Organisation can be deleted if it doesn't have any projects """
        return len(self.projects) == 0

    @staticmethod
    def get(organisation_id: int):
        """
        Gets specified organisation by id
        :param organisation_id: organisation ID in scope
        :return: Organisation if found otherwise None
        """
        return Organisation.query.get(organisation_id)

    @staticmethod
    def get_organisation_by_name(organisation_name: str):
        """ Get organisation by name
        :param organisation_name: name of organisation
        :return: Organisation if found else None
        """
        return Organisation.query.filter_by(name=organisation_name).first()

    @staticmethod
    def get_all_organisations():
        """ Gets all organisations"""
        return Organisation.query.all()

    @staticmethod
    def get_all_organisations_for_user(user_id: int):
        """ Gets all organisations; only returns secret orgs if user belongs to it """
        return Organisation.query.filter(
            or_(
                Organisation.visibility != OrganisationVisibility.SECRET.value,
                # User().get_by_id(user_id) in Organisation.admins,
            )
        )

    def as_dto(self):
        """ Returns a dto for an organisation """
        org_dto = OrganisationDTO()
        org_dto.organisation_id = self.id
        org_dto.name = self.name
        org_dto.logo = self.logo
        org_dto.url = self.url
        org_dto.admins = [admin.username for admin in self.admins]
        org_dto.visibility = OrganisationVisibility(self.visibility).name

        return org_dto
