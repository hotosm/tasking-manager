import logging
import sys
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from loguru import logger as log
from pyinstrument import Profiler
from sentry_sdk.integrations.asgi import SentryAsgiMiddleware
from starlette.middleware.authentication import AuthenticationMiddleware
from backend.config import settings
from backend.db import db_connection
from backend.exceptions import BadRequest, Conflict, Forbidden, NotFound, Unauthorized
from backend.routes import add_api_end_points
from backend.services.users.authentication_service import TokenAuthBackend


def get_application() -> FastAPI:
    """Get the FastAPI app instance, with settings."""

    @asynccontextmanager
    async def lifespan(app):
        await db_connection.connect()
        yield
        await db_connection.disconnect()

    _app = FastAPI(
        lifespan=lifespan,
        title=settings.APP_NAME,
        description="HOTOSM Tasking Manager",
        version="0.1.0",
        license_info={
            "name": "BSD 2-Clause",
            "url": "https://raw.githubusercontent.com/hotosm/tasking-manager/develop/LICENSE.md",
        },
        debug=settings.DEBUG,
        openapi_url="/api/openapi.json",
        docs_url="/api/docs",
    )

    # Initialize Sentry only if USE_SENTRY is enabled
    if settings.USE_SENTRY:
        sentry_sdk.init(
            dsn=settings.SENTRY_BACKEND_DSN,
            environment=settings.ENVIRONMENT,
            traces_sample_rate=0.1,
            ignore_errors=[BadRequest, NotFound, Unauthorized, Forbidden, Conflict],
        )

        _app.add_middleware(SentryAsgiMiddleware)

    # Custom exception handler for invalid token and logout.
    @_app.exception_handler(HTTPException)
    async def custom_http_exception_handler(request: Request, exc: HTTPException):
        try:
            if exc.status_code == 401 and "InvalidToken" in exc.detail.get(
                "SubCode", ""
            ):
                return JSONResponse(
                    content={
                        "Error": exc.detail["Error"],
                        "SubCode": exc.detail["SubCode"],
                    },
                    status_code=exc.status_code,
                    headers={"WWW-Authenticate": "Bearer"},
                )
        except Exception as e:
            logging.debug(f"Exception while handling custom HTTPException: {e}")
            pass
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

    PROFILING = settings.PROFILING
    if PROFILING:

        @_app.middleware("http")
        async def pyinstrument_middleware(request, call_next):
            profiling = request.query_params.get("profile", False)
            if profiling:
                profiler = Profiler(async_mode=True)
                profiler.start()
                await call_next(request)
                profiler.stop()
                return HTMLResponse(profiler.output_html())
            else:
                return await call_next(request)

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
    add_api_end_points(_app)
    return _app


class InterceptHandler(logging.Handler):
    """Intercept python standard lib logging."""

    def emit(self, record):
        """Retrieve context where the logging call occurred.

        This happens to be in the 6th frame upward.
        """
        logger_opt = log.opt(depth=6, exception=record.exc_info)
        logger_opt.log(record.levelno, record.getMessage())


def get_logger():
    """Override FastAPI logger with custom loguru."""
    # Hook all other loggers into ours
    logger_name_list = [name for name in logging.root.manager.loggerDict]
    for logger_name in logger_name_list:
        logging.getLogger(logger_name).setLevel(10)
        logging.getLogger(logger_name).handlers = []
        if logger_name == "sqlalchemy":
            # Don't hook sqlalchemy, very verbose
            continue
        if "." not in logger_name:
            logging.getLogger(logger_name).addHandler(InterceptHandler())

    log.remove()
    log.add(
        sys.stderr,
        level=settings.LOG_LEVEL,
        format=(
            "{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} "
            "| {name}:{function}:{line} | {message}"
        ),
        enqueue=True,  # Run async / non-blocking
        colorize=True,
        backtrace=True,  # More detailed tracebacks
        catch=True,  # Prevent app crashes
    )

    # Only log to file in production
    if not settings.DEBUG:
        log.add(
            "/opt/logs/tm.json",
            level=settings.LOG_LEVEL,
            enqueue=True,
            serialize=True,  # JSON format
            rotation="00:00",  # New file at midnight
            retention="10 days",
        )

    log.add(
        "/opt/logs/create_project.json",
        level=settings.LOG_LEVEL,
        enqueue=True,
        serialize=True,
        rotation="00:00",
        retention="10 days",
        filter=lambda record: record["extra"].get("task") == "create_project",
    )


api = get_application()


@api.get("/")
async def home():
    """Redirect home to docs."""
    return RedirectResponse("/api/docs")
