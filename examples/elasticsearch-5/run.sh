#!/bin/bash

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
COMPILE="$1"

if [[ "${COMPILE}" == "--compile" ]]; then
    pushd "${SCRIPT_DIR}/../../"
        npm run compile
    popd
fi

pushd "${SCRIPT_DIR}"
    node .
popd
