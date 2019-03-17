# Base on Python on Debian stable
FROM python:3-stretch

EXPOSE 5000

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

# Add code base of Tasking Manager
COPY . . 

# Serve application
# CMD python manage.py runserver -h 0.0.0.0
#
# Alternative command to serve the application
# Gunicorn has been configured for single-core machine, if more cores available 
# you mayb increase the workers (-w) by using the formula ((cores x 2) + 1))
CMD NEW_RELIC_CONFIG_FILE=newrelic.ini newrelic-admin run-program gunicorn -b 0.0.0.0:5000 -w 5 --timeout 179 manage:application
