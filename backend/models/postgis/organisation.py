from backend import db

from backend.models.dtos.organisation_dto import (
    OrganisationDTO,
    NewOrganisationDTO,
    OrganisationManagerDTO,
)

from backend.models.postgis.user import User
from backend.models.postgis.campaign import Campaign, campaign_organisations
from backend.models.postgis.utils import NotFound


# Secondary table defining many-to-many relationship between organisations and managers
organisation_managers = db.Table(
    "organisation_managers",
    db.metadata,
    db.Column(
        "organisation_id", db.Integer, db.ForeignKey("organisations.id"), nullable=False
    ),
    db.Column("user_id", db.BigInteger, db.ForeignKey("users.id"), nullable=False),
    db.UniqueConstraint("organisation_id", "user_id", name="organisation_user_key"),
)


class InvalidRoleException(Exception):
    pass


class Organisation(db.Model):
    """ Describes an Organisation """

    __tablename__ = "organisations"

    # Columns
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(512), nullable=False, unique=True)
    logo = db.Column(db.String)  # URL of a logo
    description = db.Column(db.String)
    url = db.Column(db.String)

    managers = db.relationship(
        User,
        secondary=organisation_managers,
        backref=db.backref("organisations", lazy="joined"),
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
        new_org.description = new_organisation_dto.description
        new_org.url = new_organisation_dto.url

        for manager in new_organisation_dto.managers:
            user = User.get_by_username(manager)

            if user is None:
                raise NotFound(f"User {manager} Not Found")

            new_org.managers.append(user)

        new_org.create()
        return new_org

    def update(self, organisation_dto: OrganisationDTO):
        """ Updates Organisation from DTO """

        for attr, value in organisation_dto.items():
            if attr == "managers":
                continue

            try:
                is_field_nullable = self.__table__.columns[attr].nullable
                if is_field_nullable and value is not None:
                    setattr(self, attr, value)
                elif value is not None:
                    setattr(self, attr, value)
            except KeyError:
                continue

        if organisation_dto.managers:
            self.managers = []
            # Need to handle this in the loop so we can take care of NotFound users
            for manager in organisation_dto.managers:
                new_manager = User.get_by_username(manager)

                if new_manager is None:
                    raise NotFound(f"User {manager} Not Found")

                self.managers.append(new_manager)

        db.session.commit()

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()

    def can_be_deleted(self) -> bool:
        """ An Organisation can be deleted if it doesn't have any projects or teams """
        return len(self.projects) == 0 and len(self.teams) == 0

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
        """Get organisation by name
        :param organisation_name: name of organisation
        :return: Organisation if found else None
        """
        return Organisation.query.filter_by(name=organisation_name).first()

    @staticmethod
    def get_organisation_name_by_id(organisation_id: int):
        """Get organisation name by id
        :param organisation_id:
        :return: Organisation name
        """
        return Organisation.query.get(organisation_id).name

    @staticmethod
    def get_all_organisations():
        """ Gets all organisations"""
        return Organisation.query.order_by(Organisation.name).all()

    @staticmethod
    def get_organisations_managed_by_user(user_id: int):
        """ Gets organisations a user can manage """
        query_results = (
            Organisation.query.join(organisation_managers)
            .filter(
                (organisation_managers.c.organisation_id == Organisation.id)
                & (organisation_managers.c.user_id == user_id)
            )
            .order_by(Organisation.name)
            .all()
        )
        return query_results

    def as_dto(self, omit_managers=False):
        """ Returns a dto for an organisation """
        organisation_dto = OrganisationDTO()
        organisation_dto.organisation_id = self.id
        organisation_dto.name = self.name
        organisation_dto.logo = self.logo
        organisation_dto.description = self.description
        organisation_dto.url = self.url
        organisation_dto.managers = []

        if omit_managers:
            return organisation_dto

        for manager in self.managers:
            org_manager_dto = OrganisationManagerDTO()
            org_manager_dto.username = manager.username
            org_manager_dto.picture_url = manager.picture_url
            organisation_dto.managers.append(org_manager_dto)

        return organisation_dto
