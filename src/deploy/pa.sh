#!/bin/bash

date >> deploy.log 2>&1
cd ../../ >> deploy.log 2>&1
git pull -all >> deploy.log 2>&1
sudo systemctl restart nodepa >> deploy.log 2>&1
