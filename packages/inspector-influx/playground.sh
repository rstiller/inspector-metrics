#!/bin/bash

set -exuo pipefail

npm run build

docker-compose up -d influx grafana
docker-compose run --rm test
