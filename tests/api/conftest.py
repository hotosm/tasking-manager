import logging
import os
import pytest
import asyncio
import asyncpg
import subprocess
import shlex
from databases import Database
from sqlalchemy.ext.asyncio import create_async_engine
from httpx import ASGITransport, AsyncClient
from backend.config import test_settings as settings
from backend.db import Base, db_connection
from backend.main import api as fastapi_app

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

ASYNC_TEST_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI.unicode_string()
ASYNCPG_DNS_URL = str(settings.SQLALCHEMY_DATABASE_URI).replace(
    "postgresql+asyncpg://", "postgresql://"
)

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.fixture(scope="session")
async def create_test_database():
    logger.info("Creating test database.")
    conn = await asyncpg.connect(dsn=ASYNCPG_DNS_URL)
    await conn.execute(f'DROP DATABASE IF EXISTS {settings.POSTGRES_TEST_DB}_test')
    await conn.execute(f'CREATE DATABASE {settings.POSTGRES_TEST_DB}_test')
    await conn.close()

    logger.info("Test database created. Now creating tables in test database.")
    engine = create_async_engine(ASYNC_TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    logger.info("Tables created in test database.")

    dump_path = os.path.join("tests", "test_db_dump", "tm_sample_db.sql")
    logger.info("Restoring SQL dump from %s", dump_path)

    command = f"psql {ASYNCPG_DNS_URL} -f {dump_path}"

    result = subprocess.run(shlex.split(command), capture_output=True, text=True)
    if result.returncode != 0:
        logger.error("psql restore failed: %s", result.stderr)
        raise Exception("SQL restore failed")
    else:
        logger.info("SQL dump restored successfully using psql.")

    yield

    logger.info("Cleaning up: Dropping test database.")
    conn = await asyncpg.connect(dsn=ASYNCPG_DNS_URL)
    await conn.execute(f'DROP DATABASE IF EXISTS {settings.POSTGRES_TEST_DB}_test')
    await conn.close()
    logger.info("Test database dropped.")

@pytest.fixture(scope="session")
async def app(create_test_database):
    logger.info("Setting up the FastAPI app for testing.")
    test_db = Database(ASYNC_TEST_DATABASE_URL, min_size=4, max_size=8, force_rollback=True)
    await test_db.connect()
    db_connection.database = test_db
    logger.info("FastAPI app setup complete. Yielding app instance for tests.")
    yield fastapi_app

    logger.info("Disconnecting test database.")
    await test_db.disconnect()

@pytest.fixture
async def client(app):
    logger.info("Creating test client for FastAPI app.")
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        logger.info("Test client created; yielding client for test execution.")
        yield ac
    logger.info("Test client closed.")
