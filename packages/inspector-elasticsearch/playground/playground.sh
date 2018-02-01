#!/bin/bash

set -e

COMPOSE=`which docker-compose || which docker-compose.exe`

"${COMPOSE}" up -d elasticsearch kibana grafana
"${COMPOSE}" run --rm test
