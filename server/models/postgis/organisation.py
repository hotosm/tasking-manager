from server import db

from server.models.dtos.organisation_dto import (
    OrganisationDTO,
    NewOrganisationDTO,
    OrganisationManagerDTO,
)
from server.models.postgis.user import User
from server.models.postgis.campaign import Campaign, campaign_organisations
from server.models.postgis.utils import NotFound


# Secondary table defining many-to-many relationship between organisations and managers
organisation_managers = db.Table(
    "organisation_managers",
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
    name = db.Column(db.String(512), nullable=False)
    logo = db.Column(db.String)  # URL of a logo
    url = db.Column(db.String)

    managers = db.relationship(
        User, secondary=organisation_managers, backref="organisations"
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
        new_org.managers = [
            User().get_by_username(manager) for manager in new_organisation_dto.managers
        ]

        new_org.create()
        return new_org

    def update(self, organisation_dto: OrganisationDTO):
        """ Updates Organisation from DTO """
        self.name = organisation_dto.name
        self.logo = organisation_dto.logo
        self.url = organisation_dto.url

        self.managers = []
        # Need to handle this in the loop so we can take care of NotFound users
        for manager in organisation_dto.managers:
            new_manager = User().get_by_username(manager)
            if new_manager is None:
                raise NotFound(f"User {manager} Not Found")
            self.managers.append(new_manager)

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
    def get_organisations_managed_by_user(user_id: int):
        """ Gets organisations a user can manage """
        print(Organisation.managers)
        print(User().get_by_id(user_id))
        return Organisation.query.filter(
            User().get_by_id(user_id) in Organisation.managers
        )

    def as_dto(self):
        """ Returns a dto for an organisation """
        organisation_dto = OrganisationDTO()
        organisation_dto.organisation_id = self.id
        organisation_dto.name = self.name
        organisation_dto.logo = self.logo
        organisation_dto.url = self.url
        organisation_dto.managers = []
        for manager in self.managers:
            org_manager_dto = OrganisationManagerDTO()
            org_manager_dto.username = manager.username
            org_manager_dto.picture_url = manager.picture_url
            organisation_dto.managers.append(org_manager_dto)

        return organisation_dto
