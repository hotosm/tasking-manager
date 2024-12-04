from databases import Database
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.config import settings

Base = declarative_base()


class DatabaseConnection:
    """Manages database connection (sqlalchemy & encode databases)"""

    def __init__(self):
        self.database = Database(
            settings.SQLALCHEMY_DATABASE_URI.unicode_string(), min_size=5, max_size=20
        )
        # self.database = Database(settings.DTM_DB_URL.unicode_string())
        self.engine = create_engine(
            settings.SQLALCHEMY_DATABASE_URI.unicode_string(),
            pool_size=20,
            max_overflow=-1,
        )
        self.SessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        )

    async def connect(self):
        """Connect to the database."""
        await self.database.connect()

    async def disconnect(self):
        """Disconnect from the database."""
        await self.database.disconnect()

    def create_db_session(self):
        """Create a new SQLAlchemy DB session."""
        db = self.SessionLocal()
        try:
            return db
        finally:
            db.close()


db_connection = DatabaseConnection()  # Create a single instance


async def get_db():
    """Get the database connection from the pool."""
    async with db_connection.database.connection() as connection:
        yield connection
