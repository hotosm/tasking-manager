FROM quay.io/hotosm/base-python-image as base
LABEL version=0.2
LABEL hotosm.org.maintainer="HOT Sysadmin <sysadmin@hotosm.org>"
LABEL hotosm.org.description="Builds docker image for TM Backend"

FROM base as builder

WORKDIR /install

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
COPY pyproject.toml pdm.lock README.md ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir pdm
RUN pdm install --prod --no-lock --no-editable

# Setup backend runtime dependencies
FROM base

WORKDIR /usr/src/app

ENV PATH="/usr/src/python/bin:$PATH" \
    PYTHONPATH="/usr/src/python/lib"

# Setup backend runtime dependencies
RUN apk update && \
    apk add --no-cache \
        postgresql-libs geos proj-util

COPY --from=builder \
    /install/__pypackages__/3.8 \
    /usr/src/python
COPY backend backend/
COPY migrations migrations/
COPY scripts/world scripts/world/
COPY scripts/database scripts/database/
COPY manage.py .

ENV TZ UTC # Fix timezone (do not change - see issue #3638)
EXPOSE 5000

CMD ["gunicorn", "-c", "python:backend.gunicorn", "manage:application"]
