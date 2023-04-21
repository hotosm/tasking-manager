ARG ALPINE_IMG_TAG=3.17
ARG PYTHON_IMG_TAG=3.10

FROM docker.io/python:${PYTHON_IMG_TAG}-alpine${ALPINE_IMG_TAG} as base
ARG APP_VERSION=0.1.0
ARG DOCKERFILE_VERSION=0.4.0
ARG ALPINE_IMG_TAG
ARG PYTHON_IMG_TAG
ARG MAINTAINER=sysadmin@hotosm.org
LABEL org.hotosm.tasks.app-version="${APP_VERSION}" \
      org.hotosm.tasks.alpine-img-tag="${ALPINE_IMG_TAG}" \
      org.hotosm.tasks.python-img-tag="${PYTHON_IMG_TAG}" \
      org.hotosm.tasks.dockerfile-version="${DOCKERFILE_VERSION}" \
      org.hotosm.tasks.maintainer="${MAINTAINER}" \
      org.hotosm.tasks.api-port="5000"
ENV TZ UTC # Fix timezone (do not change - see issue #3638)



FROM base as extract-deps
WORKDIR /opt/python
COPY pyproject.toml pdm.lock README.md /opt/python/
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir pdm==2.5.3
RUN pdm export --prod --without-hashes > requirements.txt



FROM base as build
WORKDIR /opt/python
# Setup backend build-time dependencies
RUN apk update && \
    apk add \
        postgresql-dev \
        gcc \
        g++ \
        python3-dev \
        musl-dev \
        libffi-dev \
        geos-dev \
        proj-util \
        proj-dev \
        make
# Setup backend Python dependencies
COPY --from=extract-deps \
    /opt/python/requirements.txt /opt/python/
RUN pip install --user --no-warn-script-location \
    --no-cache-dir -r /opt/python/requirements.txt



FROM base as runtime
ARG PYTHON_IMG_TAG
WORKDIR /usr/src/app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PATH="/home/appuser/.local/bin:$PATH" \
    PYTHON_LIB="/home/appuser/.local/lib/python$PYTHON_IMG_TAG/site-packages" \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt \
    REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
# Setup backend runtime dependencies
RUN apk update && \
    apk add --no-cache \
        postgresql-libs geos proj-util
COPY --from=build \
    /root/.local \
    /home/appuser/.local
COPY backend backend/
COPY migrations migrations/
COPY scripts/world scripts/world/
COPY scripts/database scripts/database/
COPY manage.py .
# Add non-root user, permissions
RUN adduser -D -u 900 -h /home/appuser -s /bin/false appuser \
    && chown -R appuser:appuser /opt /home/appuser
USER appuser



FROM runtime as debug
RUN pip install --user --no-warn-script-location \
    --no-cache-dir debugpy==1.6.7
CMD ["python", "-m", "debugpy", "--wait-for-client", "--listen", "0.0.0.0:5678", \
    "-m", "gunicorn", "-c", "python:backend.gunicorn", "manage:application" \
    "--reload", "--log-level", "error"]



FROM runtime as prod
# Pre-compile packages to .pyc (init speed gains)
RUN python -c "import compileall; compileall.compile_path(maxlevels=10, quiet=1)"
# Note: 4 workers as running with docker
# Note: For Kubernetes, change to uvicorn and a single worker
CMD ["gunicorn", "-c", "python:backend.gunicorn", "manage:application" \
    "--workers", "4", "--log-level", "error"]
