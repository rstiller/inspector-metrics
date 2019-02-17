# inspector-metrics

Monitoring / metric library similar to http://metrics.dropwizard.io

<p align="center">
    <a href="https://travis-ci.org/rstiller/inspector-metrics">
        <img src="http://img.shields.io/travis/rstiller/inspector-metrics/master.svg" alt="Build Status">
    </a>
</p>

This is the monorepository for the `inspector-metrics` modules.  
`inspector-metrics` modules are a collection of modules around application metrics and monitoring for nodejs.  

## Modules

| Module | Description | Link |  |
| :--- | :--- | :--- | :--- |
| [inspector-metrics](packages/inspector-metrics) | API / interface module |  | ![NPM Version](https://img.shields.io/npm/v/inspector-metrics.svg) ![License](https://img.shields.io/npm/l/inspector-metrics.svg) ![Dependencies Status](https://img.shields.io/david/rstiller/inspector-metrics.svg) |
| [inspector-carbon](packages/inspector-carbon) | reporter for graphite / carbon | [graphite](https://www.npmjs.com/package/graphite) | ![NPM Version](https://img.shields.io/npm/v/inspector-carbon.svg) ![License](https://img.shields.io/npm/l/inspector-carbon.svg) ![Dependencies Status](https://img.shields.io/david/rstiller/inspector-carbon.svg) |
| [inspector-csv](packages/inspector-csv) | reporter for CSV files |  | ![NPM Version](https://img.shields.io/npm/v/inspector-csv.svg) ![License](https://img.shields.io/npm/l/inspector-csv.svg) ![Dependencies Status](https://img.shields.io/david/rstiller/inspector-csv.svg) |
| [inspector-elasticsearch](packages/inspector-elasticsearch) | reporter for elasticsearch | [elasticsearch](https://github.com/elastic/elasticsearch-js) | ![NPM Version](https://img.shields.io/npm/v/inspector-elasticsearch.svg) ![License](https://img.shields.io/npm/l/inspector-elasticsearch.svg) ![Dependencies Status](https://img.shields.io/david/rstiller/inspector-elasticsearch.svg) |
| [inspector-influx](packages/inspector-influx) | reporter for influxdb | [influxdb](https://github.com/node-influx/node-influx) | ![NPM Version](https://img.shields.io/npm/v/inspector-influx.svg) ![License](https://img.shields.io/npm/l/inspector-influx.svg) ![Dependencies Status](https://img.shields.io/david/rstiller/inspector-influx.svg) |
| [inspector-prometheus](packages/inspector-prometheus) | reporter for prometheus / pushgateway | [prometheus](https://prometheus.io/docs/introduction/overview/) | ![NPM Version](https://img.shields.io/npm/v/inspector-prometheus.svg) ![License](https://img.shields.io/npm/l/inspector-prometheus.svg) ![Dependencies Status](https://img.shields.io/david/rstiller/inspector-prometheus.svg) |
| [inspector-vm](packages/inspector-vm) | metric collection for nodejs VM |  | ![NPM Version](https://img.shields.io/npm/v/inspector-vm.svg) ![License](https://img.shields.io/npm/l/inspector-vm.svg) ![Dependencies Status](https://img.shields.io/david/rstiller/inspector-vm.svg) |

## 3rd party packages

| Module | Description | Link |  |
| :--- | :--- | :--- | :--- |
| [inspector-amqp](https://github.com/ttous/inspector-amqp) | reporter for AMQP | [amqp-ts](https://github.com/abreits/amqp-ts) | ![NPM Version](https://img.shields.io/npm/v/inspector-amqp.svg) ![License](https://img.shields.io/npm/l/inspector-amqp.svg) ![Dependencies Status](https://img.shields.io/david/ttous/inspector-amqp.svg) |


## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
