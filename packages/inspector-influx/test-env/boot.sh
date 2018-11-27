#!/bin/bash

# path to this script from the current directory
SCRIPTFILE="${BASH_SOURCE[0]}"
# path of this script's folder
SCRIPTDIR=`dirname "${SCRIPTFILE}"`
# absolute path of project root folder
BASEDIR=`cd -P "${SCRIPTDIR}/.."; pwd`
# docker-compose command
DC=`which docker-compose || which docker-compose.exe`

# goto project root dir
pushd "${BASEDIR}"

"${DC}" build
"${DC}" up -d grafana influx
"${DC}" ps

# go back to whereever
popd
