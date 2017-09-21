FROM python:3-stretch

# Install dependencies for shapely
RUN apt-get update \
 && apt-get upgrade -y \
 && apt-get install -y libgeos-dev \
 && rm -rf /var/lib/apt/lists/*


# Uncomment and set with valid connection string for use locally
#ENV TM_DB=postgresql://user:pass@host/db

WORKDIR /src

# Add and install Python modules
ADD requirements.txt /src/requirements.txt
RUN pip install -r requirements.txt

ADD . .

# Expose
EXPOSE 8000

# Gunicorn configured for single-core machine, if more cores available increase workers using formula ((cores x 2) + 1))
CMD gunicorn -b 0.0.0.0:8000 -w 3 --timeout 179 manage:application
