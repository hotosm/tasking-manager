from sqlalchemy import Column, String, Integer, BigInteger, Table, ForeignKey
from sqlalchemy.orm import relationship
from backend.exceptions import NotFound
from backend.models.dtos.licenses_dto import LicenseDTO, LicenseListDTO
from backend.db import Base, get_session
session = get_session()

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
    def get_by_id(license_id: int):
        """Get license by id"""
        map_license = session.get(License, license_id)

        if map_license is None:
            raise NotFound(sub_code="LICENSE_NOT_FOUND", license_id=license_id)

        return map_license

    @classmethod
    def create_from_dto(cls, dto: LicenseDTO) -> int:
        """Creates a new License class from dto"""
        new_license = cls()
        new_license.name = dto.name
        new_license.description = dto.description
        new_license.plain_text = dto.plain_text

        session.add(new_license)
        session.commit()

        return new_license.id

    def update_license(self, dto: LicenseDTO):
        """Update existing license"""
        self.name = dto.name
        self.description = dto.description
        self.plain_text = dto.plain_text
        session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        session.delete(self)
        session.commit()

    @staticmethod
    def get_all() -> LicenseListDTO:
        """Gets all licenses currently stored"""
        results = session.query(License).all()

        dto = LicenseListDTO()
        for result in results:
            imagery_license = LicenseDTO()
            imagery_license.license_id = result.id
            imagery_license.name = result.name
            imagery_license.description = result.description
            imagery_license.plain_text = result.plain_text
            dto.licenses.append(imagery_license)

        return dto

    def as_dto(self) -> LicenseDTO:
        """Get the license from the DB"""
        dto = LicenseDTO()
        dto.license_id = self.id
        dto.name = self.name
        dto.description = self.description
        dto.plain_text = self.plain_text

        return dto
