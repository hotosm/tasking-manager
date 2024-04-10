ARG DEBIAN_IMG_TAG=slim-bookworm
ARG PYTHON_IMG_TAG=3.10

FROM docker.io/python:${PYTHON_IMG_TAG}-${DEBIAN_IMG_TAG} as base
ARG APP_VERSION=0.1.0
ARG DOCKERFILE_VERSION=0.5.0
ARG ALPINE_IMG_TAG
ARG PYTHON_IMG_TAG
ARG MAINTAINER=sysadmin@hotosm.org
LABEL org.hotosm.tasks.app-version="${APP_VERSION}" \
      org.hotosm.tasks.debian-img-tag="${DEBIAN_IMG_TAG}" \
      org.hotosm.tasks.python-img-tag="${PYTHON_IMG_TAG}" \
      org.hotosm.tasks.dockerfile-version="${DOCKERFILE_VERSION}" \
      org.hotosm.tasks.maintainer="${MAINTAINER}" \
      org.hotosm.tasks.api-port="5000"
# Fix timezone (do not change - see issue #3638)
ENV TZ UTC
# Add non-root user, permissions, init log dir
RUN useradd --uid 9000 --create-home --home /home/appuser --shell /bin/false appuser




FROM base as extract-deps
RUN pip install --no-cache-dir --upgrade pip
WORKDIR /opt/python
COPY pyproject.toml pdm.lock README.md /opt/python/
RUN pip install --no-cache-dir pdm==2.7.4
RUN pdm export --prod --without-hashes > requirements.txt



FROM base as build
RUN pip install --no-cache-dir --upgrade pip
WORKDIR /opt/python
# Setup backend build-time dependencies
RUN apt-get update
RUN apt-get install --no-install-recommends -y build-essential
RUN apt-get install --no-install-recommends -y \
        postgresql-server-dev-15 \
        python3-dev \
        libffi-dev \
        libgeos-dev
# Setup backend Python dependencies
COPY --from=extract-deps \
    /opt/python/requirements.txt /opt/python/
USER appuser:appuser
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
RUN apt-get update && \
    apt-get install --no-install-recommends -y \
        postgresql-client libgeos3.11.1 proj-bin && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
COPY --from=build \
    /home/appuser/.local \
    /home/appuser/.local
USER appuser:appuser
COPY backend backend/
COPY migrations migrations/
COPY scripts/world scripts/world/
COPY scripts/database scripts/database/
COPY manage.py .



FROM runtime as debug
RUN pip install --user --no-warn-script-location \
    --no-cache-dir debugpy==1.6.7
EXPOSE 5678/tcp
CMD ["python", "-m", "debugpy", "--wait-for-client", "--listen", "0.0.0.0:5678", \
    "-m", "gunicorn", "-c", "python:backend.gunicorn", "manage:application", \
    "--reload", "--log-level", "error"]



FROM runtime as prod
USER root
RUN apt-get update && \
	apt-get install -y curl && \
	apt-get clean && \
	rm -rf /var/lib/apt/lists/*
# Pre-compile packages to .pyc (init speed gains)
RUN python -c "import compileall; compileall.compile_path(maxlevels=10, quiet=1)"
RUN python -m compileall .
EXPOSE 5000/tcp
USER appuser:appuser
CMD ["gunicorn", "-c", "python:backend.gunicorn", "manage:application", \
    "--workers", "1", "--log-level", "error"]
