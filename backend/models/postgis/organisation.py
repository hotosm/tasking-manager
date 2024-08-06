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
from databases import Database

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

    def create(self, session):
        """Creates and saves the current model to the DB"""
        session.add(self)
        session.commit()

    def save(self):
        session.commit()

    @classmethod
    async def create_from_dto(cls, new_organisation_dto: NewOrganisationDTO, session):
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
            user = await User.get_by_username(manager, session)

            if user is None:
                raise NotFound(sub_code="USER_NOT_FOUND", username=manager)

            new_org.managers.append(user)
            
        session.add(new_org)
        await session.commit()
        return new_org


    async def update(self, organisation_dto: OrganisationDTO, session):
        """Updates Organisation from DTO"""
        org_dict = organisation_dto.dict(exclude_unset=True)

        for attr, value in org_dict.items():
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
            for manager in organisation_dto.managers:
                new_manager = await User.get_by_username(manager, session)

                if new_manager is None:
                    raise NotFound(sub_code="USER_NOT_FOUND", username=manager)

                self.managers.append(new_manager)

        await session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        session.delete(self)
        session.commit()

    async def can_be_deleted(organisation_id: int, db) -> bool:
        # Check if the organization has any projects
        projects_query = """
            SELECT COUNT(*) 
            FROM projects 
            WHERE organisation_id = :organisation_id
        """
        projects_count = await db.fetch_val(projects_query, values={"organisation_id": organisation_id})
        # Check if the organization has any teams
        teams_query = """
            SELECT COUNT(*) 
            FROM teams 
            WHERE organisation_id = :organisation_id
        """
        teams_count = await db.fetch_val(teams_query, values={"organisation_id": organisation_id})
        # Organisation can be deleted if it has no projects and no teams
        return projects_count == 0 and teams_count == 0

    @staticmethod
    def get(organisation_id: int, session):
        """
        Gets specified organisation by id
        :param organisation_id: organisation ID in scope
        :return: Organisation if found otherwise None
        """
        return session.get(Organisation, organisation_id)

    @staticmethod
    async def get_organisation_by_name(organisation_name: str, session):
        """Get organisation by name
        :param organisation_name: name of organisation
        :return: Organisation if found else None
        """
        result = await session.execute(
            select(Organisation).filter_by(name=organisation_name)
        )
        return result.scalars().first()
        # return session.query(Organisation).filter_by(name=organisation_name).first()

    @staticmethod
    def get_organisation_name_by_id(organisation_id: int):
        """Get organisation name by id
        :param organisation_id:
        :return: Organisation name
        """
        return session.query(Organisation).get(organisation_id).name

    @staticmethod
    async def get_all_organisations(db: Database):
        """Gets all organisations"""
        query = """
            SELECT 
                o.id AS "organisationId",
                o.name,
                o.slug,
                o.logo,
                o.description,
                o.url,
                CASE 
                    WHEN o.type = 1 THEN 'FREE'
                    WHEN o.type = 2 THEN 'DISCOUNTED'
                    WHEN o.type = 3 THEN 'FULL_FEE'
                    ELSE 'UNKNOWN'
                END AS type,
                o.subscription_tier AS "subscriptionTier"
            FROM organisations o
            ORDER BY o.name
        """
        result = await db.fetch_all(query)
        return result

    @staticmethod
    async def get_organisations_managed_by_user(user_id: int, db: Database):
        """Gets organisations a user can manage"""
        query = f"""
            SELECT 
                o.id AS "organisationId",
                o.name,
                o.slug,
                o.logo,
                o.description,
                o.url,
                CASE 
                    WHEN o.type = {OrganisationType.FREE.value} THEN 'FREE'
                    WHEN o.type = {OrganisationType.DISCOUNTED.value} THEN 'DISCOUNTED'
                    WHEN o.type = {OrganisationType.FULL_FEE.value} THEN 'FULL_FEE'
                    ELSE 'UNKNOWN'
                END AS type,
                o.subscription_tier AS "subscriptionTier"
            FROM organisations o
            JOIN organisation_managers om ON o.id = om.organisation_id
            WHERE om.user_id = :user_id
            ORDER BY o.name
        """
        params = {"user_id": user_id}
        result = await db.fetch_all(query, values=params)
        return result

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
