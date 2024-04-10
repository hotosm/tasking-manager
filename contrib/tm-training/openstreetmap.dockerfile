FROM ubuntu:22.04 as openstreetmap-repo
RUN apt-get update \
 && apt-get install --no-install-recommends -y \
      git \
      ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /repo
RUN update-ca-certificates
RUN git clone https://github.com/openstreetmap/openstreetmap-website.git



# Taken from https://github.com/openstreetmap/openstreetmap-website
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install system packages then clean up to minimize image size
RUN apt-get update \
 && apt-get install --no-install-recommends -y \
      build-essential \
      curl \
      default-jre-headless \
      file \
      git-core \
      gpg-agent \
      libarchive-dev \
      libffi-dev \
      libgd-dev \
      libpq-dev \
      libsasl2-dev \
      libvips-dev \
      libxml2-dev \
      libxslt1-dev \
      libyaml-dev \
      locales \
      postgresql-client \
      ruby \
      ruby-dev \
      ruby-bundler \
      software-properties-common \
      tzdata \
      unzip \
      nodejs \
      npm \
 && npm install --global yarn \
 # We can't use snap packages for firefox inside a container, so we need to get firefox+geckodriver elsewhere
 && add-apt-repository -y ppa:mozillateam/ppa \
 && echo "Package: *\nPin: release o=LP-PPA-mozillateam\nPin-Priority: 1001" > /etc/apt/preferences.d/mozilla-firefox \
 && apt-get install --no-install-recommends -y \
      firefox-geckodriver \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Install compatible Osmosis to help users import sample data in a new instance
RUN curl -OL https://github.com/openstreetmap/osmosis/releases/download/0.47.2/osmosis-0.47.2.tgz \
 && tar -C /usr/local -xzf osmosis-0.47.2.tgz

ENV DEBIAN_FRONTEND=dialog

#
# NOTE the below instructions were modified from the original dockerfile
#

COPY osm-entrypoint.sh /

# Setup app location
WORKDIR /app

# Copy the app, as normally expected to be mounted
COPY --from=openstreetmap-repo \
    /repo/openstreetmap-website/ /app/

# Install Ruby packages
RUN bundle install \
    # Install NodeJS packages using yarn
    && bundle exec bin/yarn install \
    # Copy the required config to correct location
    # https://github.com/openstreetmap/openstreetmap-website/blob/master/DOCKER.md#initial-setup
    && cp config/example.storage.yml config/storage.yml \
    && cp config/docker.database.yml config/database.yml \
    # Replace db --> osm-db compose service
    && sed -i 's/host: db/host: osm-db/' config/database.yml \
    && touch config/settings.local.yml \
    && chmod +x /osm-entrypoint.sh

ENTRYPOINT ["/osm-entrypoint.sh"]
