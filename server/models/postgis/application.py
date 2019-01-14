from server import db
from server.models.dtos.application_dto import ApplicationDTO, ApplicationsDTO
from server.models.postgis.utils import timestamp
from server.services.users.authentication_service import AuthenticationService


class Application(db.Model):
    """ Describes an application that is authorized to access the TM """
    __tablename__ = "application_keys"

    id = db.Column(db.BigInteger, primary_key=True)
    user = db.Column(db.BigInteger, db.ForeignKey('users.id', name='fk_users'), nullable=False)
    app_key = db.Column(db.String, nullable=False)
    created = db.Column(db.DateTime, default=timestamp)

    def generate_application_key(self, user_id):
        """
        Creates a key for use with an application.
        """
        token = AuthenticationService.generate_session_token_for_user(user_id)
        return token

    def create(self, user_id):
        application = Application()
        application.app_key = self.generate_application_key(user_id)
        application.user = user_id
        db.session.add(application)
        db.session.commit()

        return application

    def save(self):
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def get_token(user: int, appkey: str):
        return db.session.query(Application).filter(Application.user == user) \
                   .filter(Application.app_key == appkey).one_or_none()

    @staticmethod
    def get_all_for_user(user: int):
        query = db.session.query(Application).filter(Application.user == user)
        applications_dto = ApplicationsDTO()
        for r in query:
            application_dto = ApplicationDTO()
            application_dto.id = r.id
            application_dto.user = r.user
            application_dto.app_key = r.app_key
            application_dto.created = r.created
            applications_dto.applications.append(application_dto)
        return applications_dto

    def as_dto(self):
        app_dto = ApplicationDTO()
        app_dto.user = self.user
        app_dto.app_key = self.app_key
        app_dto.created = self.created
        return app_dto
