from backend import db
from backend.exceptions import NotFound
from backend.models.dtos.interests_dto import InterestDTO, InterestsListDTO

# Secondary table defining many-to-many join for interests of a user.
user_interests = db.Table(
    "user_interests",
    db.metadata,
    db.Column("interest_id", db.Integer, db.ForeignKey("interests.id")),
    db.Column("user_id", db.BigInteger, db.ForeignKey("users.id")),
)

# Secondary table defining many-to-many join for interests of a project.
project_interests = db.Table(
    "project_interests",
    db.metadata,
    db.Column("interest_id", db.Integer, db.ForeignKey("interests.id")),
    db.Column("project_id", db.BigInteger, db.ForeignKey("projects.id")),
)


class Interest(db.Model):
    """Describes an interest for projects and users"""

    __tablename__ = "interests"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True)

    @staticmethod
    def get_by_id(interest_id: int):
        """Get interest by id"""
        interest = db.session.get(Interest, interest_id)
        if interest is None:
            raise NotFound(sub_code="INTEREST_NOT_FOUND", interest_id=interest_id)

        return interest

    @staticmethod
    def get_by_name(name: str):
        """Get interest by name"""
        interest = Interest.query.filter(Interest.name == name).first()
        if interest is None:
            raise NotFound(sub_code="INTEREST_NOT_FOUND", interest_name=name)

        return interest

    def update(self, dto):
        """Update existing interest"""
        self.name = dto.name
        db.session.commit()

    def create(self):
        """Creates and saves the current model to the DB"""
        db.session.add(self)
        db.session.commit()

    def save(self):
        """Save changes to db"""
        db.session.commit()

    def delete(self):
        """Deletes the current model from the DB"""
        db.session.delete(self)
        db.session.commit()

    def as_dto(self) -> InterestDTO:
        """Get the interest from the DB"""
        dto = InterestDTO()
        dto.id = self.id
        dto.name = self.name

        return dto

    @staticmethod
    def get_all_interests():
        """Get all interests"""
        query = Interest.query.all()
        interest_list_dto = InterestsListDTO()
        interest_list_dto.interests = [interest.as_dto() for interest in query]

        return interest_list_dto
