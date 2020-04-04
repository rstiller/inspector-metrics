#!/bin/bash

mkdir -p /opt/inspector-metrics/.tmp/$NODE_VERSION/
rsync -avh --exclude *.sh \
    lib \
    test \
    package.json \
    tsconfig.json \
    /opt/inspector-metrics/.tmp/$NODE_VERSION/ \
    --delete
cd /opt/inspector-metrics/.tmp/$NODE_VERSION/
npm i
npm run bootstrap
npm run build
