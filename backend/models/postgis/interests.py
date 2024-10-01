from sqlalchemy import (
    Column,
    Integer,
    String,
    BigInteger,
    Table,
    ForeignKey,
    TextualSelect,
    select,
)
from backend.exceptions import NotFound
from backend.models.dtos.interests_dto import InterestDTO, InterestsListDTO
from backend.db import Base, get_session
from databases import Database

session = get_session()

# Secondary table defining many-to-many join for interests of a user.
user_interests = Table(
    "user_interests",
    Base.metadata,
    Column("interest_id", Integer, ForeignKey("interests.id")),
    Column("user_id", BigInteger, ForeignKey("users.id")),
)

# Secondary table defining many-to-many join for interests of a project.
project_interests = Table(
    "project_interests",
    Base.metadata,
    Column("interest_id", Integer, ForeignKey("interests.id")),
    Column("project_id", BigInteger, ForeignKey("projects.id")),
)


class Interest(Base):
    """Describes an interest for projects and users"""

    __tablename__ = "interests"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)

    @staticmethod
    async def get_by_id(interest_id: int, db: Database):
        """Get interest by id"""
        query = select(Interest).where(Interest.id == interest_id)
        result = await db.fetch_one(query)

        if result:
            # If Interest is a Pydantic model or class, you can instantiate it
            return Interest(**result)
        return None

    @staticmethod
    def get_by_name(name: str):
        """Get interest by name"""
        interest = session.query(Interest).filter(Interest.name == name).first()
        if interest is None:
            raise NotFound(sub_code="INTEREST_NOT_FOUND", interest_name=name)

        return interest

    def update(self, dto):
        """Update existing interest"""
        self.name = dto.name
        session.commit()

    def create(self):
        """Creates and saves the current model to the DB"""
        session.add(self)
        session.commit()

    def save(self):
        """Save changes to db"""
        session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        session.delete(self)
        session.commit()

    def as_dto(self) -> InterestDTO:
        """Get the interest from the DB"""
        dto = InterestDTO()
        dto.id = self.id
        dto.name = self.name

        return dto

    @staticmethod
    def get_all_interests():
        """Get all interests"""
        query = session.query(Interest).all()
        interest_list_dto = InterestsListDTO()
        interest_list_dto.interests = [interest.as_dto() for interest in query]

        return interest_list_dto
