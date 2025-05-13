ARG DEBIAN_IMG_TAG=slim-bookworm
ARG PYTHON_IMG_TAG=3.10
ARG UV_IMG_TAG=0.5.2
FROM ghcr.io/astral-sh/uv:${UV_IMG_TAG} AS uv

FROM docker.io/python:${PYTHON_IMG_TAG}-${DEBIAN_IMG_TAG} AS base

ARG APP_VERSION=5.1.0
ARG DOCKERFILE_VERSION=1.0.0
ARG DEBIAN_IMG_TAG
ARG PYTHON_IMG_TAG
ARG MAINTAINER=sysadmin@hotosm.org

LABEL org.hotosm.tasks.app-version="${APP_VERSION}" \
    org.hotosm.tasks.debian-img-tag="${DEBIAN_IMG_TAG}" \
    org.hotosm.tasks.python-img-tag="${PYTHON_IMG_TAG}" \
    org.hotosm.tasks.dockerfile-version="${DOCKERFILE_VERSION}" \
    org.hotosm.tasks.maintainer="${MAINTAINER}" \
    org.hotosm.tasks.api-port="5000"

# Fix timezone (do not change - see issue #3638)
ENV TZ=UTC

# Add non-root user
RUN useradd --uid 9000 --create-home --home /home/appuser --shell /bin/false appuser

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive \
    apt-get -q install --no-install-recommends -y \
    build-essential \
    postgresql-server-dev-15 \
    python3-dev \
    libffi-dev \
    libgeos-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# - Silence uv complaining about not being able to use hard links,
# - tell uv to byte-compile packages for faster application startups,
# - prevent uv from accidentally downloading isolated Python builds,
# - use a temp dir instead of cache during install,
# - select system python version,
# - declare `/opt/python` as the target for `uv sync` (i.e. instead of .venv).
ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never \
    UV_NO_CACHE=1 \
    UV_PYTHON="python$PYTHON_IMG_TAG" \
    UV_PROJECT_ENVIRONMENT=/opt/python
STOPSIGNAL SIGINT

FROM base AS build

# Copy UV binary from installer stage
COPY --from=uv /uv /usr/local/bin/uv


# Copy dependency specs
COPY --chown=appuser:appuser --chmod=755 pyproject.toml uv.lock /_lock/

# Ensure caching & install with or without monitoring, depending on flag
RUN --mount=type=cache,target=/root/.cache <<EOT
    uv sync \
        --project /_lock \
        --locked \
        --no-editable \
        --no-dev \
        --no-install-project
EOT

FROM base AS runtime
ARG PYTHON_IMG_TAG

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt \
    REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt \
    PATH="/opt/python/bin:$PATH" \
    PYTHONPATH="/usr/src/app:$PYTHONPATH" \
    PYTHON_LIB="/opt/python/lib/python$PYTHON_IMG_TAG/site-packages"

WORKDIR /usr/src/app

# Setup backend runtime dependencies
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive \
    apt-get -q install --no-install-recommends -y \
    postgresql-client \
    libgeos3.11.1 \
    proj-bin \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy installed dependencies
COPY --from=build --chown=appuser:appuser --chmod=755 /opt/python /opt/python

# Copy application code
COPY --chown=appuser:appuser --chmod=755 backend backend/
COPY --chown=appuser:appuser --chmod=755 migrations migrations/
COPY --chown=appuser:appuser --chmod=755 scripts/world scripts/world/
COPY --chown=appuser:appuser --chmod=755 scripts/database scripts/database/
COPY --chown=appuser:appuser --chmod=755 scripts/commands scripts/commands/
COPY --chown=appuser:appuser --chmod=755 manage.py .

RUN chown -R appuser:appuser ./

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl --fail http://localhost:5000/api/docs

FROM runtime AS debug
# Copy UV binary
COPY --from=uv /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock /_lock/
RUN --mount=type=cache,target=/root/.cache <<EOT
    uv sync \
        --project /_lock \
        --locked \
        --no-editable \
        --no-install-project \
        --group test \
        --group lint \
        --group dev
EOT

EXPOSE 5678
EXPOSE 5000

USER appuser:appuser

# Run with debugpy to enable remote debugging
CMD ["python", "-m", "debugpy", "--listen", "0.0.0.0:5678", \
    "-m", "uvicorn", "backend.main:api", "--host", "0.0.0.0", "--port", "5000", \
    "--reload", "--log-level", "debug"]

FROM debug AS ci
USER root
RUN apt-get update --quiet \
    && DEBIAN_FRONTEND=noninteractive \
    apt-get install -y --quiet --no-install-recommends \
    "git" \
    && rm -rf /var/lib/apt/lists/*
# Override entrypoint, as not possible in Github action
ENTRYPOINT []
CMD ["sleep", "infinity"]

FROM runtime AS prod

EXPOSE 5678
EXPOSE 5000

USER appuser:appuser

CMD ["uvicorn", "backend.main:api", "--host", "0.0.0.0", "--port", "5000", \
    "--workers", "8", "--log-level", "critical","--no-access-log"]
