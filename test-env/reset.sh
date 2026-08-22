#!/bin/bash

# Teardown the local test environment (stop containers + remove volumes).
# Delegates compose-engine selection (podman/docker) to compose.sh.

SCRIPTFILE="${BASH_SOURCE[0]}"
SCRIPTDIR=`dirname "${SCRIPTFILE}"`
COMPOSE_HELPER="${SCRIPTDIR}/compose.sh"

bash "${COMPOSE_HELPER}" down -v
bash "${COMPOSE_HELPER}" ps
