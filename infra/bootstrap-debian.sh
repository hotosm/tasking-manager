#!/bin/bash -e
#
# Node.JS 10
# PostgreSQL 9.5

# Do not prompt to trust Github.com
/usr/bin/ssh-keyscan -t rsa github.com | sudo /usr/bin/tee -a /etc/ssh/ssh_known_hosts

# Do not prompt for answers
export DEBIAN_FRONTEND=noninteractive
export LC_ALL="en_US.UTF-8"
export LC_CTYPE="en_US.UTF-8"
export LC_ALL=C
sudo dpkg-reconfigure --frontend=noninteractive locales

sudo apt-get -y install \
    make build-essential \
    libssl-dev zlib1g-dev libbz2-dev \
    libreadline-dev libsqlite3-dev \
    llvm libncurses5-dev libncursesw5-dev \
    xz-utils tk-dev libffi-dev liblzma-dev

sudo apt-get -y update

echo "Upgrade Ubuntu packages.."
sudo DEBIAN_FRONTEND=noninteractive apt-get -y \
    -o Dpkg::Options::="--force-confdef" \
    -o Dpkg::Options::="--force-confold" upgrade

echo "Install basic utilities.."
sudo apt-get -y install \
    awscli \
    curl \
    git \
    ruby \
    unzip \
    wget \
    grub kpartx             # Dependencies for ec2-ami-tools

# Install Python3.6
wget https://www.python.org/ftp/python/3.6.9/Python-3.6.9.tgz
tar -xf Python-3.6.9.tgz && \
    cd Python-3.6.9 && \
    sudo ./configure --enable-optimizations --with-ensurepip=install && \
    sudo make altinstall

# Install mapping related stuff
# libgdal* - Geospatial Data Abstraction Library (GDAL)
# libgeos* - Geometry engine
# libproj* - Cartographic projects & translations between CRS
sudo apt-get -y install \
    libgdal-dev \
    libgeos-3.5.1 libgeos-dev \
    libproj12 libproj-dev \
    libxml2 libxml2-dev \
    libjson-c-dev

sudo apt-get -y install \
    postgresql-9.5 \
    postgresql-server-dev-9.5 \
    libpq-dev                    # PostgreSQL Library to C

# Setup Node.JS v10.x
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get -y install nodejs

# Install dependencies
sudo npm install gulp -g
sudo npm install browser-sync --save # Probably add this to package.json?

# sudo git clone --recursive https://github.com/hotosm/tasking-manager.git /tasking-manager
sudo git clone --recursive --single-branch \
    --branch deployment/hot-tasking-manager \
    https://github.com/hotosm/tasking-manager.git /tasking-manager


# inotify watches for filesystem (why?)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf

# Local install of aws-cfn-bootstrap template
wget https://s3.amazonaws.com/cloudformation-examples/aws-cfn-bootstrap-latest.tar.gz
sudo pip2 install aws-cfn-bootstrap-latest.tar.gz

# EC2 AMI tools installation (why?)
wget https://s3.amazonaws.com/ec2-downloads/ec2-ami-tools.zip
sudo mkdir -p /usr/local/ec2
sudo unzip -qq ec2-ami-tools.zip -d /usr/local/ec2

# add to etc/profile.d/myenvvars.sh export variable EC2_AMITOOL_HOME
sudo touch /etc/profile.d/myenvvars.sh
echo "export EC2_AMITOOL_HOME=/usr/local/ec2/ec2-ami-tools-1.5.7" | sudo tee -a /etc/profile.d/myenvvars.sh
echo "export PATH=/usr/local/ec2/ec2-ami-tools-1.5.7/bin:$PATH:" | sudo tee -a /etc/profile.d/myenvvars.sh
