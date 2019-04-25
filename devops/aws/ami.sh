```
sudo yum update &&
sudo yum -y upgrade &&
sudo yum -y install python36 python36-devel python36-libs &&
wget https://nodejs.org/dist/latest-v9.x/node-v9.11.2-linux-x64.tar.gz &&
tar -xzvf node-v9.11.2-linux-x64.tar.gz &&
cd node-v9.11.2-linux-x64 &&
sudo cp -r bin/* /usr/local/bin/ && sudo cp -r lib/* /usr/local/lib && sudo cp -r share/* /usr/local/share &&
cd .. &&
sudo yum install -y postgresql95 && sudo yum install postgresql95-server &&
sudo yum install -y libxml2 libxml2-devel &&
sudo yum install -y geos geos-devel &&


```
