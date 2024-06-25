from slugify import slugify

from sqlalchemy import Column, Integer, String, DateTime, BigInteger, ForeignKey, Table, UniqueConstraint
from sqlalchemy.orm import relationship, backref
from backend.exceptions import NotFound
from backend.models.dtos.organisation_dto import (
    OrganisationDTO,
    NewOrganisationDTO,
    OrganisationManagerDTO,
)
from backend.models.postgis.user import User
from backend.models.postgis.campaign import Campaign, campaign_organisations
from backend.models.postgis.statuses import OrganisationType
from backend.db import Base, get_session
session = get_session()
from sqlalchemy import select
from sqlalchemy.orm import selectinload

# Secondary table defining many-to-many relationship between organisations and managers
organisation_managers = Table(
    "organisation_managers",
    Base.metadata,
    Column(
        "organisation_id", Integer, ForeignKey("organisations.id"), nullable=False
    ),
    Column("user_id", BigInteger, ForeignKey("users.id"), nullable=False),
    UniqueConstraint("organisation_id", "user_id", name="organisation_user_key"),
)


class InvalidRoleException(Exception):
    pass


class Organisation(Base):
    """Describes an Organisation"""

    __tablename__ = "organisations"

    # Columns
    id = Column(Integer, primary_key=True)
    name = Column(String(512), nullable=False, unique=True)
    slug = Column(String(255), nullable=False, unique=True)
    logo = Column(String)  # URL of a logo
    description = Column(String)
    url = Column(String)
    type = Column(Integer, default=OrganisationType.FREE.value, nullable=False)
    subscription_tier = Column(Integer)

    managers = relationship(
        User,
        secondary=organisation_managers,
        backref=backref("organisations"),
    )
    campaign = relationship(
        Campaign, secondary=campaign_organisations, backref="organisation"
    )

    def create(self):
        """Creates and saves the current model to the DB"""
        session.add(self)
        session.commit()

    def save(self):
        session.commit()

    @classmethod
    def create_from_dto(cls, new_organisation_dto: NewOrganisationDTO):
        """Creates a new organisation from a DTO"""
        new_org = cls()

        new_org.name = new_organisation_dto.name
        new_org.slug = new_organisation_dto.slug or slugify(new_organisation_dto.name)
        new_org.logo = new_organisation_dto.logo
        new_org.description = new_organisation_dto.description
        new_org.url = new_organisation_dto.url
        new_org.type = OrganisationType[new_organisation_dto.type].value
        new_org.subscription_tier = new_organisation_dto.subscription_tier

        for manager in new_organisation_dto.managers:
            user = User.get_by_username(manager)

            if user is None:
                raise NotFound(sub_code="USER_NOT_FOUND", username=manager)

            new_org.managers.append(user)

        new_org.create()
        return new_org

    def update(self, organisation_dto: OrganisationDTO):
        """Updates Organisation from DTO"""

        for attr, value in organisation_dto.items():
            if attr == "type" and value is not None:
                value = OrganisationType[organisation_dto.type].value
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
                    raise NotFound(sub_code="USER_NOT_FOUND", username=manager)

                self.managers.append(new_manager)

        session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        session.delete(self)
        session.commit()

    async def can_be_deleted(self) -> bool:
        """An Organisation can be deleted if it doesn't have any projects or teams"""
        return await len(self.projects) == 0 and await len(self.teams) == 0

    @staticmethod
    def get(organisation_id: int, session):
        """
        Gets specified organisation by id
        :param organisation_id: organisation ID in scope
        :return: Organisation if found otherwise None
        """
        return session.get(Organisation, organisation_id)

    @staticmethod
    def get_organisation_by_name(organisation_name: str):
        """Get organisation by name
        :param organisation_name: name of organisation
        :return: Organisation if found else None
        """
        return session.query(Organisation).filter_by(name=organisation_name).first()

    @staticmethod
    def get_organisation_name_by_id(organisation_id: int):
        """Get organisation name by id
        :param organisation_id:
        :return: Organisation name
        """
        return session.query(Organisation).get(organisation_id).name


    @staticmethod
    async def get_all_organisations(session):
        """Gets all organisations"""
        result = await session.execute(
            select(Organisation).options(selectinload(Organisation.managers)).order_by(Organisation.name)
        )
        return result.scalars().all()


    @staticmethod
    async def get_organisations_managed_by_user(user_id: int, session):
        """Gets organisations a user can manage"""
        query = (
            select(Organisation)
            .options(
                selectinload(Organisation.managers),
            )
            .join(organisation_managers)
            .filter(
                (organisation_managers.c.organisation_id == Organisation.id) &
                (organisation_managers.c.user_id == user_id)
            )
            .order_by(Organisation.name)
        )
        result = await session.execute(query)
        query_results = result.scalars().all()
        return query_results
    

    async def fetch_managers(self, session):
        """Fetch managers asynchronously"""
        await session.refresh(self, ['managers'])

    def as_dto(self, omit_managers=False):
        """Returns a dto for an organisation"""
        organisation_dto = OrganisationDTO()
        organisation_dto.organisation_id = self.id
        organisation_dto.name = self.name
        organisation_dto.slug = self.slug
        organisation_dto.logo = self.logo
        organisation_dto.description = self.description
        organisation_dto.url = self.url
        organisation_dto.managers = []
        organisation_dto.type = OrganisationType(self.type).name
        organisation_dto.subscription_tier = self.subscription_tier

        if omit_managers:
            return organisation_dto

        for manager in self.managers:
            org_manager_dto = OrganisationManagerDTO()
            org_manager_dto.username = manager.username
            org_manager_dto.picture_url = manager.picture_url
            organisation_dto.managers.append(org_manager_dto)

        return organisation_dto
