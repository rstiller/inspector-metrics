#!/bin/bash

set -exuo pipefail

docker-compose up -d influx grafana
docker-compose run --rm test
