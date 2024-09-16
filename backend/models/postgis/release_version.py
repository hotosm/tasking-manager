from databases import Database
from sqlalchemy import Column, String, DateTime, insert

from backend.db import Base, get_session

session = get_session()


class ReleaseVersion(Base):
    """Describes an current release version of TM (i.e. github.com/hotosm/tasking-manager)"""

    __tablename__ = "release_version"
    tag_name = Column(String(64), nullable=False, primary_key=True)
    published_at = Column(DateTime, nullable=False)

    def update(self):
        session.commit()

    async def save(self, db: Database):
        query = insert(ReleaseVersion.__table__).values(
            tag_name=self.tag_name, published_at=self.published_at
        )
        await db.execute(query)

    @staticmethod
    async def get(db: Database):
        """Get the latest release version"""
        query = """SELECT * FROM release_version LIMIT 1"""
        return await db.fetch_one(query=query)
