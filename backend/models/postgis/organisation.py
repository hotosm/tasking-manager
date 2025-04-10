from databases import Database
from fastapi import HTTPException
from slugify import slugify
from sqlalchemy import (
    BigInteger,
    Column,
    ForeignKey,
    Integer,
    String,
    Table,
    UniqueConstraint,
)
from sqlalchemy.orm import backref, relationship

from backend.db import Base
from backend.exceptions import NotFound
from backend.models.dtos.organisation_dto import (
    NewOrganisationDTO,
    OrganisationDTO,
    OrganisationManagerDTO,
    UpdateOrganisationDTO,
)
from backend.models.postgis.campaign import Campaign, campaign_organisations
from backend.models.postgis.statuses import OrganisationType
from backend.models.postgis.user import User

# Secondary table defining many-to-many relationship between organisations and managers
organisation_managers = Table(
    "organisation_managers",
    Base.metadata,
    Column("organisation_id", Integer, ForeignKey("organisations.id"), nullable=False),
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

    async def create_from_dto(new_organisation_dto: NewOrganisationDTO, db: Database):
        """Creates a new organisation from a DTO and associates managers"""
        slug = new_organisation_dto.slug or slugify(new_organisation_dto.name)
        query = """
            INSERT INTO organisations (name, slug, logo, description, url, type, subscription_tier)
            VALUES (:name, :slug, :logo, :description, :url, :type, :subscription_tier)
            RETURNING id
        """
        values = {
            "name": new_organisation_dto.name,
            "slug": slug,
            "logo": new_organisation_dto.logo,
            "description": new_organisation_dto.description,
            "url": new_organisation_dto.url,
            "type": OrganisationType[new_organisation_dto.type].value,
            "subscription_tier": new_organisation_dto.subscription_tier,
        }

        try:
            organisation_id = await db.execute(query, values)

            for manager in new_organisation_dto.managers:
                user_query = "SELECT id FROM users WHERE username = :username"
                user = await db.fetch_one(user_query, {"username": manager})

                if not user:
                    raise NotFound(sub_code="USER_NOT_FOUND", username=manager)

                manager_query = """
                INSERT INTO organisation_managers (organisation_id, user_id)
                VALUES (:organisation_id, :user_id)
                """
                await db.execute(
                    manager_query,
                    {"organisation_id": organisation_id, "user_id": user.id},
                )

            return organisation_id

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) from e

    async def update(organisation_dto: UpdateOrganisationDTO, db: Database):
        """Updates Organisation from DTO"""
        try:
            org_id = organisation_dto.organisation_id
            org_dict = organisation_dto.dict(exclude_unset=True)
            if "type" in org_dict and org_dict["type"] is not None:
                org_dict["type"] = OrganisationType[org_dict["type"].upper()].value

            update_keys = {
                key: org_dict[key]
                for key in org_dict.keys()
                if key not in ["organisation_id", "managers"]
            }
            set_clause = ", ".join(f"{key} = :{key}" for key in update_keys.keys())
            if set_clause:
                update_query = f"""
                UPDATE organisations
                SET {set_clause}
                WHERE id = :id
                """
                await db.execute(update_query, values={**update_keys, "id": org_id})

            if organisation_dto.managers:
                clear_managers_query = """
                DELETE FROM organisation_managers
                WHERE organisation_id = :id
                """
                await db.execute(clear_managers_query, values={"id": org_id})
                for manager_username in organisation_dto.managers:
                    user_query = "SELECT id FROM users WHERE username = :username"
                    user = await db.fetch_one(
                        user_query, {"username": manager_username}
                    )

                    if not user:
                        raise NotFound(
                            sub_code="USER_NOT_FOUND", username=manager_username
                        )

                    insert_manager_query = """
                    INSERT INTO organisation_managers (organisation_id, user_id)
                    VALUES (:organisation_id, :user_id)
                    """
                    await db.execute(
                        insert_manager_query,
                        {"organisation_id": org_id, "user_id": user.id},
                    )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) from e

    async def can_be_deleted(organisation_id: int, db) -> bool:
        # Check if the organization has any projects
        projects_query = """
            SELECT COUNT(*)
            FROM projects
            WHERE organisation_id = :organisation_id
        """
        projects_count = await db.fetch_val(
            projects_query, values={"organisation_id": organisation_id}
        )
        # Check if the organization has any teams
        teams_query = """
            SELECT COUNT(*)
            FROM teams
            WHERE organisation_id = :organisation_id
        """
        teams_count = await db.fetch_val(
            teams_query, values={"organisation_id": organisation_id}
        )
        # Organisation can be deleted if it has no projects and no teams
        return projects_count == 0 and teams_count == 0

    @staticmethod
    async def get(organisation_id: int, db: Database):
        """
        Gets specified organisation by id
        :param organisation_id: organisation ID in scope
        :return: Organisation if found otherwise None
        """
        organization = await db.fetch_one(
            "SELECT * FROM organisations WHERE id = :id", values={"id": organisation_id}
        )
        return organization["id"] if organization else None

    @staticmethod
    async def get_organisation_by_name(organisation_name: str, db: Database):
        """Get organisation by name
        :param organisation_name: name of organisation
        :return: Organisation if found else None
        """
        query = """
        SELECT * FROM organisations
        WHERE name = :name
        """

        result = await db.fetch_one(query, values={"name": organisation_name})
        return result if result else None

    @staticmethod
    async def get_all_organisations(db: Database):
        """Gets all organisations"""
        query = """
            SELECT
                o.id AS organisation_id,
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
                o.subscription_tier,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', u.id,
                            'username', u.username,
                            'picture_url', u.picture_url
                        )
                    ) FILTER (WHERE u.id IS NOT NULL), '[]'
                ) AS managers
            FROM organisations o
            LEFT JOIN organisation_managers om ON o.id = om.organisation_id
            LEFT JOIN users u ON om.user_id = u.id
            GROUP BY o.id
            ORDER BY o.name
        """
        result = await db.fetch_all(query)
        return result

    @staticmethod
    async def get_organisations_managed_by_user(user_id: int, db: Database):
        """Gets organisations a user can manage"""
        query = f"""
        SELECT
            o.id AS organisation_id,
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
            o.subscription_tier,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', u.id,
                        'username', u.username,
                        'picture_url', u.picture_url
                    )
                ) FILTER (WHERE u.id IS NOT NULL), '[]'
            ) AS managers
        FROM organisations o
        LEFT JOIN organisation_managers om ON o.id = om.organisation_id
        LEFT JOIN users u ON om.user_id = u.id
        WHERE om.user_id = :user_id  -- Filter organisations by the user who manages them
        GROUP BY o.id
        ORDER BY o.name
        """
        params = {"user_id": user_id}
        result = await db.fetch_all(query, values=params)
        return result

    async def fetch_managers(self, session):
        """Fetch managers asynchronously"""
        await session.refresh(self, ["managers"])

    def as_dto(org, omit_managers=False):
        """Returns a dto for an organisation"""
        organisation_dto = OrganisationDTO()
        organisation_dto.organisation_id = org.organisation_id
        organisation_dto.name = org.name
        organisation_dto.slug = org.slug
        organisation_dto.logo = org.logo
        organisation_dto.description = org.description
        organisation_dto.url = org.url
        organisation_dto.managers = []
        organisation_dto.type = org.type
        organisation_dto.subscription_tier = org.subscription_tier

        if omit_managers:
            return organisation_dto

        for manager in org.managers:
            org_manager_dto = OrganisationManagerDTO()
            org_manager_dto.username = manager.username
            org_manager_dto.picture_url = manager.picture_url
            organisation_dto.managers.append(org_manager_dto)

        return organisation_dto
