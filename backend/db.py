from databases import Database
from sqlalchemy.orm import declarative_base

from backend.config import settings

Base = declarative_base()


class DatabaseConnection:
    """Manages database connection (encode databases)"""

    def __init__(self):
        self.database = Database(
            settings.SQLALCHEMY_DATABASE_URI.unicode_string(), min_size=4, max_size=8
        )

    async def connect(self):
        """Connect to the database."""
        await self.database.connect()

    async def disconnect(self):
        """Disconnect from the database."""
        await self.database.disconnect()


db_connection = DatabaseConnection()


async def get_db():
    """Get the database connection from the pool."""
    async with db_connection.database.connection() as connection:
        yield connection
