#!/bin/bash

# Resolve a compose CLI, preferring podman. Prints the command (and args) and
# execs it so this works as a drop-in: `bash test-env/compose.sh <compose-args...>`
SCRIPTFILE="${BASH_SOURCE[0]}"
SCRIPTDIR=`dirname "${SCRIPTFILE}"`

if command -v podman >/dev/null 2>&1 && podman compose version >/dev/null 2>&1; then
  COMPOSE=(podman compose)
elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
elif command -v podman-compose >/dev/null 2>&1; then
  COMPOSE=(podman-compose)
else
  echo "no compose tool found (tried: podman compose, docker compose, docker-compose, podman-compose)" >&2
  exit 1
fi

# run from the project root (parent of test-env/) so compose file + context resolve
ROOT=`cd -P "${SCRIPTDIR}/.."; pwd`
cd "${ROOT}" || exit 1

exec "${COMPOSE[@]}" "$@"
