#!/bin/bash

#Go to root directory
cd ../

#Delete logs older than 7 days
find /logs/ -type f -mtime +7 -name '*.log' -execdir rm -- '{}' \;

#Run node js with logging
node /main.js > "$(date +%Y%m%d_%H%M%S).log" 2>&1