#!/bin/bash

mkdir -p /opt/inspector-prometheus/.tmp/$NODE_VERSION/
rsync -avh --exclude *.sh \
    lib \
    test \
    package.json \
    tsconfig.json \
    tslint.json \
    mocha.opts \
    /opt/inspector-prometheus/.tmp/$NODE_VERSION/ \
    --delete
cd /opt/inspector-prometheus/.tmp/$NODE_VERSION/
npm i
npm run build
