FROM python:3-stretch

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install dependencies for shapely
RUN apt-get update \
  && apt-get upgrade -y \
  && apt-get install -y libgeos-dev \
  && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Upgrade pip
RUN pip install --upgrade pip

ARG branch=develop
RUN git clone --depth=1 git://github.com/hotosm/tasking-manager.git \
	--branch $branch /usr/src/app

## API/SERVER CONFIGURATION

# Add and install Python modules
RUN pip install --no-cache-dir -r requirements.txt

## CLIENT CONFIGURATION

# Install nodejs.
RUN curl -sL https://deb.nodesource.com/setup_9.x | bash - \
  && apt-get install -y nodejs

RUN npm install -g gulp-cli karma karma-jasmine karma-chrome-launcher

RUN cd client && npm link gulp && \
	npm install closure-util --save && \
	npm install && gulp build

EXPOSE 5000
CMD ["python", "manage.py", "runserver", "-h", "0.0.0.0"]
