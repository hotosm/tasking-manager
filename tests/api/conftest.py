import logging
import os
import pytest
import asyncpg
from databases import Database
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.sql import text
from httpx import ASGITransport, AsyncClient
from backend.config import test_settings as settings
from backend.db import Base, db_connection
from backend.main import api as fastapi_app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Construct database URLs
ASYNC_TEST_DB_URL = settings.SQLALCHEMY_DATABASE_URI.unicode_string().replace(
    settings.POSTGRES_TEST_DB, f"{settings.POSTGRES_TEST_DB}_test"
)
SYNCPG_DB_URL = str(settings.SQLALCHEMY_DATABASE_URI).replace(
    "postgresql+asyncpg://", "postgresql://"
)
TEST_DB_NAME = f"{settings.POSTGRES_TEST_DB}_test"
DUMP_PATH = os.path.join("tests", "test_db_dump", "tm_sample_db.sql")


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session")
async def create_test_database():
    logger.info("Creating test database: %s", TEST_DB_NAME)
    conn = await asyncpg.connect(dsn=SYNCPG_DB_URL)
    await conn.execute(f"DROP DATABASE IF EXISTS {TEST_DB_NAME}")
    await conn.execute(f"CREATE DATABASE {TEST_DB_NAME}")
    await conn.close()

    test_db_url = SYNCPG_DB_URL.replace(settings.POSTGRES_TEST_DB, TEST_DB_NAME)
    logger.info("Using test database URL: %s", test_db_url)

    # Create tables
    engine = create_async_engine(ASYNC_TEST_DB_URL)
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    logger.info("Tables created successfully in test database.")

    # Restore SQL dump if available
    # if os.path.isfile(DUMP_PATH):
    #     logger.info("Restoring SQL dump from %s", DUMP_PATH)
    #     command = f"psql {test_db_url} -f {DUMP_PATH}"
    #     result = subprocess.run(shlex.split(command), capture_output=True, text=True)
    #     if result.returncode != 0:
    #         logger.error("SQL restore failed: %s", result.stderr)
    #         raise RuntimeError("SQL restore failed")
    #     logger.info("SQL dump restored successfully.")
    # else:
    #     logger.warning("SQL dump file not found: %s", DUMP_PATH)
    #     raise FileNotFoundError(f"SQL dump file not found: {DUMP_PATH}")

    yield  # Allow tests to run

    # Cleanup: Drop test database
    logger.info("Dropping test database: %s", TEST_DB_NAME)
    conn = await asyncpg.connect(dsn=SYNCPG_DB_URL)
    await conn.execute(f"DROP DATABASE IF EXISTS {TEST_DB_NAME}")
    await conn.close()
    logger.info("Test database dropped.")


@pytest.fixture(scope="session")
async def app(create_test_database):
    logger.info("Setting up FastAPI app for testing.")
    test_db = Database(ASYNC_TEST_DB_URL, min_size=4, max_size=8, force_rollback=True)
    await test_db.connect()
    db_connection.database = test_db
    yield fastapi_app
    logger.info("Disconnecting test database.")
    await test_db.disconnect()


@pytest.fixture
async def client(app):
    logger.info("Creating test client for FastAPI app.")
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="https://test"
    ) as ac:
        yield ac
    logger.info("Test client closed.")
