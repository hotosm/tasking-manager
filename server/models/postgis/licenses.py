from server.models.dtos.licenses_dto import LicenseDTO
from server.models.postgis.utils import NotFound
from server import db

# Secondary table defining the many-to-many join
users_licenses_table = db.Table(
    'users_licenses', db.metadata,
    db.Column('user', db.BigInteger, db.ForeignKey('users.id')),
    db.Column('license', db.Integer, db.ForeignKey('licenses.id')))


class License(db.Model):
    """ Describes an individual license"""
    __tablename__ = "licenses"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True)
    description = db.Column(db.String)
    plain_text = db.Column(db.String)

    projects = db.relationship("Project", backref='license')
    users = db.relationship("License", secondary=users_licenses_table)  # Many to Many relationship

    @staticmethod
    def get_by_id(license_id: int):
        """ Get license by id """
        return License.query.get(license_id)

    @classmethod
    def create_from_dto(cls, dto: LicenseDTO) -> int:
        """ Creates a new License class from dto """
        new_license = cls()
        new_license.name = dto.name
        new_license.description = dto.description
        new_license.plain_text = dto.plain_text

        db.session.add(new_license)
        db.session.commit()

        return new_license.id

    def update_license(self, dto: LicenseDTO):
        """ Update existing license """
        self.name = dto.name
        self.description = dto.description
        self.plain_text = dto.plain_text
        db.session.commit()

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()

    def get_all(self):
        pass

    def as_dto(self) -> LicenseDTO:
        """ Get the license from the DB """
        dto = LicenseDTO()
        dto.license_id = self.id
        dto.name = self.name
        dto.description = self.description
        dto.plain_text = self.plain_text

        return dto
