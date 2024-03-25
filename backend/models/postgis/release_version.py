from sqlalchemy import Column, String, DateTime
from backend.db.database import Base, session

class ReleaseVersion(Base):
    """Describes an current release version of TM (i.e. github.com/hotosm/tasking-manager)"""

    __tablename__ = "release_version"
    tag_name = Column(String(64), nullable=False, primary_key=True)
    published_at = Column(DateTime, nullable=False)

    def update(self):
        session.commit()

    def save(self):
        session.add(self)
        session.commit()

    @staticmethod
    def get():
        return session.query(ReleaseVersion).first()
