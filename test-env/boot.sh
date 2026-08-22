#!/bin/bash

# Boot the local test environment (build + start the metric backends).
# Delegates compose-engine selection (podman/docker) to compose.sh.

SCRIPTFILE="${BASH_SOURCE[0]}"
SCRIPTDIR=`dirname "${SCRIPTFILE}"`
COMPOSE_HELPER="${SCRIPTDIR}/compose.sh"

bash "${COMPOSE_HELPER}" build
bash "${COMPOSE_HELPER}" up -d grafana graphite elasticsearch kibana influx prometheus pushgateway
bash "${COMPOSE_HELPER}" ps
