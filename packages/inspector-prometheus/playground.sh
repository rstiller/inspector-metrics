#!/bin/bash

set -e

DC=`which docker-compose || which docker-compose.exe`

npm run clean
npm run compile
"${DC}" up -d prometheus grafana
node build/playground/playground.js
