#!/bin/bash



#sudo apt-get -y install python-software-properties
#sudo apt-add-repository ppa:chris-lea/node.js

sudo apt-get update
sudo apt-get -y install build-essential chrpath libssl-dev libxft-dev libfreetype6 libfreetype6-dev libfontconfig1 libfontconfig1-dev redis-server mysql-server imagemagick

curl --silent --location https://deb.nodesource.com/setup_4.x | sudo bash -
sudo apt-get install --yes nodejs


#sudo npm cache clean -f
#sudo npm install -g n
#sudo n stable


sudo npm install -g nodemon


wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.8-linux-x86_64.tar.bz2
tar xvf phantomjs-1.9.8-linux-x86_64.tar.bz2
cd phantomjs-1.9.8-linux-x86_64/
sudo cp bin/phantomjs /usr/bin/phantomjs
