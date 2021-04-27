#!/bin/bash

#Get bash file location and cd to it
BASEDIR=$(dirname "$0")
cd "$BASEDIR"

#Go to root directory
cd ../

#Delete logs older than 7 days
find logs/ -type f -mtime +7 -name '*.log' -execdir rm -- '{}' \;

#Fix ipv6 errors
ping6 -c 6 google.hu

#Run node js with logging
node main.js > logs/"$(date +%Y%m%d_%H%M%S).log" 2>&1
