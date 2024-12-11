from databases import Database
from sqlalchemy import BigInteger, Column, ForeignKey, Integer, String, Table, select

from backend.db import Base
from backend.models.dtos.interests_dto import InterestDTO


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

    def as_dto(self) -> InterestDTO:
        """Get the interest from the DB"""
        dto = InterestDTO()
        dto.id = self.id
        dto.name = self.name

        return dto
