import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from loguru import logger as log
from pyinstrument import Profiler
from starlette.middleware.authentication import AuthenticationMiddleware

from backend.config import settings
from backend.db import db_connection
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
        root_path=settings.APP_BASE_URL,
        openapi_url="/api/openapi.json",
        docs_url="/api/docs",
    )

    # Set custom logger
    # _app.logger = get_logger()

    # Custom exception handler for 401 errors
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
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    PROFILING = True  # Set this from a settings model

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
            # format=log_json_format, # JSON format func
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
