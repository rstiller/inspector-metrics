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

You should have [nodejs](https://nodejs.org/en/), [docker](https://www.docker.com/) and [docker-compose](https://docs.docker.com/compose/) installed.

boot test environment:  
`./test-env/boot.sh`

shutdown test environment:  
`./test-env/reset.sh`

execute compatibility tests:  
`docker-compose run --rm nodeX`  
_X = nodejs version (available: 14, 15, 16, 17, 18, 19)_

init / update project (if a new dependency is introduced or an existing is updated):  
```bash
pnpm i
```

generate dependency report:  
```bash
# run 'pnpm run build' before checking dependencies
docker-compose run --rm deps
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
