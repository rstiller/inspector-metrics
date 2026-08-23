# inspector-metrics

Monitoring / metric library similar to http://metrics.dropwizard.io

[![CI](https://github.com/rstiller/inspector-metrics/actions/workflows/ci.yml/badge.svg)](https://github.com/rstiller/inspector-metrics/actions/workflows/ci.yml)

This is the mono repository for the `inspector-metrics` modules.  
`inspector-metrics` modules are a collection of modules around application metrics and monitoring for nodejs.  

Take a look at the [Documentation](https://rstiller.github.io/inspector-metrics/).

## Features

- metric model independent from time-series DB
- multiple reporter modules
- multi process support ([nodejs cluster](https://nodejs.org/api/cluster.html))
- business friendly license ([MIT](https://www.opensource.org/licenses/mit-license.php) License)

## Modules

| Module | Description | Link |  |
| :--- | :--- | :--- | :--- |
| [inspector-metrics](packages/inspector-metrics) | API / interface module |  | ![NPM Version](https://img.shields.io/npm/v/inspector-metrics.svg) ![License](https://img.shields.io/npm/l/inspector-metrics.svg) |
| *Reporter* |  |  |  |
| [inspector-carbon](packages/inspector-carbon) | reporter for graphite / carbon | [graphite](https://www.npmjs.com/package/graphite) | ![NPM Version](https://img.shields.io/npm/v/inspector-carbon.svg) ![License](https://img.shields.io/npm/l/inspector-carbon.svg) |
| [inspector-csv](packages/inspector-csv) | reporter for CSV files |  | ![NPM Version](https://img.shields.io/npm/v/inspector-csv.svg) ![License](https://img.shields.io/npm/l/inspector-csv.svg) |
| [inspector-elasticsearch](packages/inspector-elasticsearch) | reporter for elasticsearch | [elasticsearch](https://github.com/elastic/elasticsearch-js) | ![NPM Version](https://img.shields.io/npm/v/inspector-elasticsearch.svg) ![License](https://img.shields.io/npm/l/inspector-elasticsearch.svg) |
| [inspector-influx](packages/inspector-influx) | reporter for influxdb | [influxdb](https://github.com/node-influx/node-influx) | ![NPM Version](https://img.shields.io/npm/v/inspector-influx.svg) ![License](https://img.shields.io/npm/l/inspector-influx.svg) |
| [inspector-prometheus](packages/inspector-prometheus) | reporter for prometheus / pushgateway | [prometheus](https://prometheus.io/docs/introduction/overview/) | ![NPM Version](https://img.shields.io/npm/v/inspector-prometheus.svg) ![License](https://img.shields.io/npm/l/inspector-prometheus.svg) |
| *Metric Collectors* |  |  |  |
| [inspector-vm](packages/inspector-vm) | metric collection for nodejs VM |  | ![NPM Version](https://img.shields.io/npm/v/inspector-vm.svg) ![License](https://img.shields.io/npm/l/inspector-vm.svg) |

## 3rd party modules

| Module | Description | Link |  |
| :--- | :--- | :--- | :--- |
| [inspector-amqp](https://github.com/ttous/inspector-amqp) | reporter for AMQP | [amqp-ts](https://github.com/abreits/amqp-ts) | ![NPM Version](https://img.shields.io/npm/v/inspector-amqp.svg) ![License](https://img.shields.io/npm/l/inspector-amqp.svg) |
| [inspector-nats](https://github.com/ttous/inspector-nats) | reporter for [NATS](https://nats.io/) | [node-nats](https://github.com/nats-io/node-nats) | ![NPM Version](https://img.shields.io/npm/v/inspector-nats.svg) ![License](https://img.shields.io/npm/l/inspector-nats.svg) |

## Examples

Code examples for `javascript` and `typescript` are in the `examples` folder.

## development

### local setup / prerequisites

You should have [nodejs](https://nodejs.org/en/) and a container runtime with compose support
installed ([podman](https://podman.io/) is preferred, plain [docker](https://www.docker.com/) also works).

The repository is developed with [pnpm 11](https://pnpm.io/) on a recent LTS **Node.js** (`22`, `24` or
`26`): pnpm 11 requires Node.js `>= 22.13`, and the remaining native module — `native-hdr-histogram`
(NAPI prebuilds) — builds/resolves on all of them. The core `inspector-metrics` package itself has no
mandatory native dependency, since the 64-bit integer support previously provided by `node-cint64` is
now implemented in pure JavaScript on top of
[`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt).
Likewise `inspector-vm` no longer depends on the native `@sematext/gc-stats` module — GC events are
collected via Node's built-in [`perf_hooks`](https://nodejs.org/api/perf_hooks.html)
`PerformanceObserver`. Use [corepack](https://nodejs.org/api/corepack.html) or `npm i -g pnpm@11` to get it;
the exact version is pinned in `packageManager`.

boot the local metric backends (graphite, elasticsearch, influx, prometheus, ...) for manual checking
(auto-detects podman compose / docker compose):  
`./test-env/boot.sh`

shutdown the backends:  
`./test-env/reset.sh`

init / update project (if a new dependency is introduced or an existing is updated):  
```bash
pnpm i
```

the published packages keep a lower Node.js floor (`>= 14`). CI runs the build/lint/tests on Node.js 22, 24
and 26, and a separate compatibility job re-installs the built artifacts with plain npm and smoke-tests them on
Node.js 14, 16, 18 and 20 so a dependency that drops old-Node support fails before release
(see `.github/workflows/ci.yml` and `test-env/compat-smoke.sh`).

generate dependency report:  
```bash
# run 'pnpm run build' before checking dependencies
./test-env/compose.sh run --rm deps
```

release packages / publish docs:  
```bash
# check functionality
pnpm i
pnpm run build

# publish docs
rm -fr docs/
git branch -D gh-pages
git worktree prune
git worktree list
git worktree add -b gh-pages docs origin/gh-pages
pnpm run publishDocs

# publish package
pnpm publish
```

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
