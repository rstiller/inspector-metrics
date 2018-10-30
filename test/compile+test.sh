#!/bin/bash

mkdir -p /opt/inspector-metrics/.tmp/$NODE_VERSION/
rsync -a --exclude *.sh \
    lib \
    test \
    package.json \
    tsconfig.json \
    tslint.json \
    mocha.opts \
    /opt/inspector-metrics/.tmp/$NODE_VERSION/
cd /opt/inspector-metrics/.tmp/$NODE_VERSION/
npm i
npm run build
