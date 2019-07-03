#!/bin/bash -e

#
# Do not prompt for answers
export DEBIAN_FRONTEND=noninteractive
export LC_ALL="en_US.UTF-8"
export LC_CTYPE="en_US.UTF-8"
export LC_ALL=C
sudo dpkg-reconfigure --frontend=noninteractive locales


# Add Third-party repository for Python 3.6 distribution 
# Ubuntu 16.04 does not provide via repos.
sudo add-apt-repository ppa:jonathonf/python-3.6 -y
sudo apt-get -y update

sudo DEBIAN_FRONTEND=noninteractive apt-get -y -o Dpkg::Options::=\"--force-confdef\" -o Dpkg::Options::=\"--force-confold\" dist-upgrade

sudo apt-get -y install \   # Install basic utilities
    awscli \                # AWS CLI
    curl \                  # Downloading stuff
    git \                   # Pull code for deployment
    ruby \                  # Dependency for AWS tools
    unzip \                 # AWS tools are usually zip'd
    wget \                  # Downloading stuff
    grub kpartx             # Dependencies for ec2-ami-tools

sudo apt-get -y install \      # Install all things Python
    python3.6 python3.6-dev \  # Python 3.6 from the third-party repo
    python3.6-venv \           # Python virtualenv
    python-pip                 # Default python pip (why?)

sudo apt-get -y install \        # Install Mapping related stuff
    libgdal1-dev \               # Geospatial Data Abstraction Library (GDAL)
    libgeos-3.5.0 libgeos-dev \  # Geometry engine
    libproj9 libproj-dev \       # Cartographic projects & translations between CRS
    libxml2 libxml2-dev \        # XML parsing and such
    libjson-c-dev                # Construct JSON objects in C

sudo apt-get -y install \
    postgresql-9.5 \             # PostgreSQL server
    libpq-dev \                  # PostgreSQL Library to C
    postgresql-server-dev-9.5    # PostgreSQL server (development headers)

# Setup Node.JS v10.x
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get -y install nodejs

# Install dependencies
sudo npm install gulp -g
npm install browser-sync --save # Probably add this to package.json?

sudo git clone --recursive https://github.com/hotosm/tasking-manager.git /tasking-manager

# inotify watches for filesystem (why?)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf

# Local install of aws-cfn-bootstrap template
wget https://s3.amazonaws.com/cloudformation-examples/aws-cfn-bootstrap-latest.tar.gz
pip2 install aws-cfn-bootstrap-latest.tar.gz

# EC2 AMI tools installation (why?)
wget https://s3.amazonaws.com/ec2-downloads/ec2-ami-tools.zip
sudo mkdir -p /usr/local/ec2
sudo unzip -qq ec2-ami-tools.zip -d /usr/local/ec2

# add to etc/profile.d/myenvvars.sh export variable EC2_AMITOOL_HOME
sudo touch /etc/profile.d/myenvvars.sh
echo "export EC2_AMITOOL_HOME=/usr/local/ec2/ec2-ami-tools-1.5.7" | sudo tee -a /etc/profile.d/myenvvars.sh
echo "export PATH=/usr/local/ec2/ec2-ami-tools-1.5.7/bin:$PATH:" | sudo tee -a /etc/profile.d/myenvvars.sh
