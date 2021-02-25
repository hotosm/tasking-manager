FROM circleci/python:3.6-buster-browsers

RUN sudo su -c 'apt-get update && \
      curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
      apt-get install -y nodejs libgeos-dev && \
      npm install -g @mapbox/cfn-config @mapbox/cloudfriend && \
      pip3 install awscli --upgrade && \
      echo "deb-src http://deb.debian.org/debian buster main" | tee /etc/apt/sources.list.d/source-repos-tmp.list > /dev/null && \
      cat "/etc/apt/sources.list.d/source-repos-tmp.list" && \
      apt update && \
      apt build-dep -y python3-gdal && \
      apt install gdal-bin libgdal-dev && \
      rm -rf /var/cache/apt/archives/'
