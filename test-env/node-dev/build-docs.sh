#!/usr/bin/env bash

set -euxo pipefail

mkdir -p ~/inspector-metrics
pushd ~/inspector-metrics

rsync -ar /opt/inspector-metrics/ ~/inspector-metrics/

rm -fr node_modules .pnpm-store
pnpm i --filter monorepo
pnpm i
npm run build
npm run coverage
compodoc

rm -fr /opt/inspector-metrics/docs/*
rsync -ar ~/inspector-metrics/docs/ /opt/inspector-metrics/docs/
chown -R 1000:1000 /opt/inspector-metrics/docs
