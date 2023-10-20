ARG PYTHON_IMG_TAG=3.10
FROM python:${PYTHON_IMG_TAG}-bookworm

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Add repository for node
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -

# Install dependencies
RUN apt-get update \
  && apt-get upgrade -y \
  && apt-get install -y --no-install-recommends nodejs libgeos-dev \
  && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Upgrade pip
RUN pip install --upgrade pip

# Get the Tasking Manager
ARG branch=develop
RUN git clone --depth=1 git://github.com/hotosm/tasking-manager.git \
	--branch $branch /usr/src/app

## Create & use new user to run pdm
RUN useradd --uid 9000 --create-home --home /home/appuser --shell /bin/false appuser
USER appuser:appuser

## SETUP

# Setup backend dependencies
COPY pyproject.toml pdm.lock README.md ./
RUN pip install --no-cache-dir pdm \
    && pdm config python.use_venv false \
    && pdm install --prod --no-lock --no-editable

# Setup and build frontend
RUN cd frontend && npm install --ignore-scripts && npm run build

# INITIALIZATION

EXPOSE 5000
CMD ["pdm", "run", "flask", "run", "-h", "0.0.0.0"]
