from databases import Database
from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    ForeignKey,
    String,
    delete,
    insert,
    select,
)

from backend.db import Base, get_session
from backend.models.dtos.application_dto import ApplicationDTO, ApplicationsDTO
from backend.models.postgis.utils import timestamp
from backend.services.users.authentication_service import AuthenticationService

session = get_session()


class Application(Base):
    """Describes an application that is authorized to access the TM"""

    __tablename__ = "application_keys"

    id = Column(BigInteger, primary_key=True)
    user = Column(BigInteger, ForeignKey("users.id", name="fk_users"), nullable=False)
    app_key = Column(String, nullable=False)
    created = Column(DateTime, default=timestamp)

    def generate_application_key(self, user_id):
        """
        Creates a key for use with an application.
        """
        token = AuthenticationService.generate_session_token_for_user(user_id)
        return token

    async def create(self, user_id, db: Database):
        application = Application()
        application.app_key = self.generate_application_key(user_id)
        application.user = user_id
        query = insert(Application.__table__).values(
            app_key=application.app_key, user=application.user
        )
        await db.execute(query)
        return application

    def save(self):
        session.commit()

    async def delete(self, db: Database):
        query = delete(Application).where(Application.id == self.id)
        await db.execute(query)

    @staticmethod
    async def get_token(appkey: str, db: Database):
        query = select(Application).where(Application.app_key == appkey)
        result = await db.fetch_one(query)
        return result

    @staticmethod
    async def get_all_for_user(user: int, db: Database):
        # query = session.query(Application).filter(Application.user == user)
        query = select(Application).where(Application.user == user)
        query = await db.fetch_all(query=query)
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
