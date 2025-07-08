from databases import Database
from sqlalchemy import BigInteger, Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship

from backend.db import Base
from backend.exceptions import NotFound
from backend.models.dtos.licenses_dto import LicenseDTO

# Secondary table defining the many-to-many join
user_licenses_table = Table(
    "user_licenses",
    Base.metadata,
    Column("user", BigInteger, ForeignKey("users.id")),
    Column("license", Integer, ForeignKey("licenses.id")),
)


class License(Base):
    """Describes an individual license"""

    __tablename__ = "licenses"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    description = Column(String)
    plain_text = Column(String)

    projects = relationship("Project", backref="license")
    users = relationship(
        "License", secondary=user_licenses_table
    )  # Many to Many relationship

    @staticmethod
    async def get_by_id(license_id: int, db: Database):
        """Get license by id"""
        query = """
            SELECT id AS "licenseId", name, description, plain_text AS "plainText"
            FROM licenses
            WHERE id = :license_id
        """
        map_license = await db.fetch_one(query, {"license_id": license_id})

        if map_license is None:
            raise NotFound(sub_code="LICENSE_NOT_FOUND", license_id=license_id)

        return map_license

    async def create_from_dto(license_dto: LicenseDTO, db: Database) -> int:
        """Creates a new License class from dto"""
        query = """
            INSERT INTO licenses (name, description, plain_text)
            VALUES (:name, :description, :plain_text)
            RETURNING id
        """
        values = {
            "name": license_dto.name,
            "description": license_dto.description,
            "plain_text": license_dto.plain_text,
        }

        async with db.transaction():
            new_license_id = await db.execute(query, values)
            return new_license_id

    def as_dto(self) -> LicenseDTO:
        """Get the license from the DB"""
        dto = LicenseDTO()
        dto.license_id = self.id
        dto.name = self.name
        dto.description = self.description
        dto.plain_text = self.plain_text

        return dto
