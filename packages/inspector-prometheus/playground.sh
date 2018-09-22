#!/bin/bash

set -e

docker-compose up -d prometheus grafana
docker-compose run --rm test
