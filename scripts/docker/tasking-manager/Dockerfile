FROM python:3-buster

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install dependencies for shapely
RUN apt-get update \
  && apt-get upgrade -y \
  && apt-get install -y libgeos-dev \
  && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Upgrade pip
RUN pip install --upgrade pip

# Get the Tasking Manager
ARG branch=feature/replace-frontend
RUN git clone --depth=1 git://github.com/hotosm/tasking-manager.git \
	--branch $branch /usr/src/app

## SETUP BACKEND

# Add and install Python modules
RUN pip install --no-cache-dir -r requirements.txt

## SETUP FRONTEND

# Install nodejs
RUN curl -sL https://deb.nodesource.com/setup_10.x | sudo bash -
RUN apt-get install -y nodejs

# Build frontend
RUN cd frontend && npm install && npm run build

EXPOSE 5000
CMD ["python", "manage.py", "runserver", "-h", "0.0.0.0"]
