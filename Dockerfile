# Base on Python on Debian stable
FROM python:3-stretch

EXPOSE 8000

# Install dependencies
RUN apt-get update \
  && apt-get upgrade -y \
  && apt-get install -y libgeos-dev \
  && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# Add and install Python modules
COPY requirements.txt ./
RUN pip install -r requirements.txt

## Install required dependencies
RUN apt-get install -y python3 libgeos-dev
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash - \ 
  && apt-get install -y nodejs
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Build front-end
RUN npm i gulp-cli -g

# Build front-end
COPY client/package.json /tmp/package.json
RUN cd /tmp && npm install acorn ajv
RUN mkdir -p /usr/src/app/client && cp -a /tmp/node_modules /usr/src/app/client

RUN npm link gulp
RUN npm i closure-util --save
RUN npm i openlayers --save

# Add code base of Tasking Manager
COPY . . 

# Assamble the tasking manager front-end interface
# RUN cd client && gulp build

# Serve application (be aware this runs on port 5000)
# CMD python manage.py runserver -h 0.0.0.0
#
# Alternative command to serve the application
# Gunicorn has been configured for single-core machine, if more cores available 
# you mayb increase the workers (-w) by using the formula ((cores x 2) + 1))
CMD NEW_RELIC_CONFIG_FILE=newrelic.ini newrelic-admin run-program gunicorn -b 0.0.0.0:8000 -w 5 --timeout 179 manage:application
