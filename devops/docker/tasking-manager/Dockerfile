# Base on Python on Debian stable
FROM python:3-stretch

EXPOSE 5000

# Install dependencies
RUN apt-get update \
  && apt-get upgrade -y \
  && apt-get install -y libgeos-dev \
  && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN curl -sL https://deb.nodesource.com/setup_9.x | bash - \ 
  && apt-get install -y nodejs

RUN npm i gulp-cli -g && npm link gulp

# Add code base of the Tasking Manager
ARG defined_branch=develop
RUN git clone --single-branch --branch $defined_branch https://github.com/hotosm/tasking-manager /usr/src/app
WORKDIR /usr/src/app

# Add and install Python modules for back-end
RUN pip install -r requirements.txt

# Build front-end
RUN cd client && \
  npm install browser-sync closure-util openlayers --save && \
  npm install && gulp build

# Serve application (be aware this runs on port 5000)
CMD python manage.py runserver -h 0.0.0.0
