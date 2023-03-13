#!/bin/bash

mkdir -p /opt/inspector-metrics/.tmp/$NODE_VERSION/
rsync -avh --exclude *.sh \
    .git \
    .husky \
    lib \
    test \
    package.json \
    tsconfig.json \
    /opt/inspector-metrics/.tmp/$NODE_VERSION/ \
    --delete
cd /opt/inspector-metrics/.tmp/$NODE_VERSION/
pnpm i -g rimraf
pnpm i
pnpm run build
pnpm run test
