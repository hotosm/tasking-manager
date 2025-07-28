# conftest.py
import logging
import pytest
import asyncpg
from databases import Database
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.sql import text
from httpx import ASGITransport, AsyncClient

from backend.config import test_settings as settings
from backend.db import Base, db_connection
from backend.routes import add_api_end_points


from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.authentication import AuthenticationMiddleware
from backend.services.users.authentication_service import TokenAuthBackend

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# DB URLs
db_url = settings.SQLALCHEMY_DATABASE_URI.unicode_string()
pfx, db_name = db_url.rsplit("/", 1)
ASYNC_TEST_DB_URL = f"{pfx}/{db_name}_test"
SYNCPG_DB_URL = str(settings.SQLALCHEMY_DATABASE_URI).replace(
    "postgresql+asyncpg://", "postgresql://"
)
TEST_DB_NAME = f"{db_name}_test"  # Use the same name consistently


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session")
async def test_database():
    """Fixture to create and drop test database"""
    # Connect to default postgres database to create test db
    conn = await asyncpg.connect(dsn=SYNCPG_DB_URL.rsplit("/", 1)[0] + "/postgres")
    try:
        await conn.execute(f"DROP DATABASE IF EXISTS {TEST_DB_NAME}")
        await conn.execute(f"CREATE DATABASE {TEST_DB_NAME}")
    finally:
        await conn.close()

    # Create tables and extensions
    engine = create_async_engine(ASYNC_TEST_DB_URL)
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()

    yield  # Test run happens here

    # Cleanup
    conn = await asyncpg.connect(dsn=SYNCPG_DB_URL.rsplit("/", 1)[0] + "/postgres")
    try:
        await conn.execute(f"DROP DATABASE IF EXISTS {TEST_DB_NAME}")
    finally:
        await conn.close()


@pytest.fixture
async def db_connection_fixture(test_database):
    """Database connection fixture with automatic rollback"""
    test_db = Database(ASYNC_TEST_DB_URL, min_size=4, max_size=8, force_rollback=True)
    await test_db.connect()
    try:
        yield test_db
    finally:
        await test_db.disconnect()


def create_test_app():
    """Create a FastAPI app specifically for testing without lifespan events."""

    _app = FastAPI(
        title=settings.APP_NAME,
        description="HOTOSM Tasking Manager - Test Mode",
        version="0.1.0-test",
        debug=True,
        openapi_url="/api/openapi.json",
        docs_url="/api/docs",
    )

    @_app.exception_handler(HTTPException)
    async def custom_http_exception_handler(request: Request, exc: HTTPException):
        if exc.status_code == 401 and "InvalidToken" in exc.detail.get("SubCode", ""):
            return JSONResponse(
                content={
                    "Error": exc.detail["Error"],
                    "SubCode": exc.detail["SubCode"],
                },
                status_code=exc.status_code,
                headers={"WWW-Authenticate": "Bearer"},
            )

        if isinstance(exc.detail, dict) and "error" in exc.detail:
            error_response = exc.detail
        else:
            error_response = {
                "error": {
                    "code": exc.status_code,
                    "sub_code": "UNKNOWN_ERROR",
                    "message": str(exc.detail),
                    "details": {},
                }
            }

        return JSONResponse(
            status_code=exc.status_code,
            content=error_response,
        )

    # Add middleware
    _app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.EXTRA_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"],
    )

    _app.add_middleware(
        AuthenticationMiddleware, backend=TokenAuthBackend(), on_error=None
    )

    # Add API endpoints
    add_api_end_points(_app)
    return _app


@pytest.fixture(scope="session")
def test_app():
    """Session-scoped test app"""
    return create_test_app()


@pytest.fixture
async def app(test_app, db_connection_fixture):
    """Reuse session app with test-specific connection"""

    # Inject test connection
    db_connection.database = db_connection_fixture
    yield test_app


@pytest.fixture
async def client(app):
    """Test client fixture"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="https://test"
    ) as ac:
        yield ac
