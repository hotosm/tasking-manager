from server import db
from server.models.dtos.interests_dto import InterestDTO
from server.models.postgis.utils import NotFound

# Secondary table defining many-to-many join for interests of a user.
users_interests = db.Table(
    "users_interests",
    db.metadata,
    db.Column("interest_id", db.Integer, db.ForeignKey("interests.id")),
    db.Column("user_id", db.BigInteger, db.ForeignKey("users.id")),
)

# Secondary table defining many-to-many join for interests of a project.
projects_interests = db.Table(
    "projects_interests",
    db.metadata,
    db.Column("interest_id", db.Integer, db.ForeignKey("interests.id")),
    db.Column("project_id", db.BigInteger, db.ForeignKey("projects.id")),
)


class Interest(db.Model):
    """ Describes an interest for projects and users"""

    __tablename__ = "interests"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True)

    @staticmethod
    def get_by_id(interest_id: int):
        """ Get interest by id """
        interest = Interest.query.get(interest_id)
        if interest is None:
            raise NotFound(f"Interest id {interest_id} not found")

        return interest

    def update(self, dto):
        """ Update existing interest """
        self.name = dto.name
        db.session.commit()

    def create(self):
        """ Creates and saves the current model to the DB """
        db.session.add(self)
        db.session.commit()

    def save(self):
        """ Save changes to db"""
        db.session.commit()

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()

    def as_dto(self) -> InterestDTO:
        """ Get the license from the DB """
        dto = InterestDTO()
        dto.id = self.id
        dto.name = self.name

        return dto
