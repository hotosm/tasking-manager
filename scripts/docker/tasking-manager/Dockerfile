ARG PYTHON_IMG_TAG=3.9
FROM python:${PYTHON_IMG_TAG}-buster

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV PATH="/usr/src/app/__pypackages__/${PYTHON_IMG_TAG}/bin:$PATH" \
    PYTHONPATH="/usr/src/app/__pypackages__/${PYTHON_IMG_TAG}/lib"

# INSTALLATION

# Add repository for node
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -

# Install dependencies
RUN apt-get update \
  && apt-get upgrade -y \
  && apt-get install -y nodejs libgeos-dev \
  && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Upgrade pip
RUN pip install --upgrade pip

# Get the Tasking Manager
ARG branch=develop
RUN git clone --depth=1 git://github.com/hotosm/tasking-manager.git \
	--branch $branch /usr/src/app

## SETUP

# Setup backend dependencies
COPY pyproject.toml pdm.lock README.md ./
RUN pip install --no-cache-dir pdm \
    && pdm config python.use_venv false \
    && pdm install --prod --no-lock --no-editable

# Setup and build frontend
RUN cd frontend && npm install && npm run build

# INITIALIZATION

EXPOSE 5000
CMD ["pdm", "run", "flask", "run", "-h", "0.0.0.0"]
