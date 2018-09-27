#!/bin/bash

set -e

DC=`which docker-compose || which docker-compose.exe`

npm run build
"${DC}" up -d prometheus grafana
"${DC}" run --rm test
