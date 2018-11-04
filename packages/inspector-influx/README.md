# inspector-influx
Typescript [Metrics Reporter](https://github.com/rstiller/inspector-metrics/blob/master/lib/metrics/metric-reporter.ts) for
[InfluxDB](https://docs.influxdata.com/influxdb/).

<p align="center">
    <a href="https://www.npmjs.org/package/inspector-influx">
        <img src="https://img.shields.io/npm/v/inspector-influx.svg" alt="NPM Version">
    </a>
    <a href="https://www.npmjs.org/package/inspector-influx">
        <img src="https://img.shields.io/npm/l/inspector-influx.svg" alt="License">
    </a>
    <a href="https://travis-ci.org/rstiller/inspector-influx">
        <img src="http://img.shields.io/travis/rstiller/inspector-influx/master.svg" alt="Build Status">
    </a>
    <a href="https://david-dm.org/rstiller/inspector-influx">
        <img src="https://img.shields.io/david/rstiller/inspector-influx.svg" alt="Dependencies Status">
    </a>
</p>

This library is made for [inspector-metrics](https://github.com/rstiller/inspector-metrics) node module and
is meant to be used with `nodejs`.  
It uses [node-influx](https://github.com/node-influx/node-influx) as influxdb client.

## install

`npm install --save inspector-influx`

## basic usage

```typescript
import { DefaultSender, InfluxMetricReporter } from "inspector-influx";
import { MetricRegistry, Timer } from "inspector-metrics";

// influxdb config from https://github.com/node-influx/node-influx/blob/master/src/index.ts#L80
const dbConfig = {
    "username": "admin",
    "password": "admin",
    "database": "example-db",
    "hosts": [
        { "host": "influx", "port": 8086 }
    ]
};

const sender = new DefaultSender(dbConfig);
const reporter: InfluxMetricReporter = new InfluxMetricReporter({
    sender,
});
const registry: MetricRegistry = new MetricRegistry();
const requests: Timer = registry.newTimer("requests");

reporter.setLog(global.console);
reporter.addMetricRegistry(registry);

reporter.start();

// example usage
setInterval(() => {
    // should report a few milliseconds
    requests.time(() => {
        let a = 0;
        let b = 1;
        for (let i = 0; i < 1e6; i++) {
            a = b + i;
        }
    });
}, 100);
```

## local dev

### compile & test with different nodejs versions

build docker images:  
```bash
docker-compose build
```

run tests:  
```bash
docker-compose run node6
docker-compose run node7
docker-compose run node8
docker-compose run node9
docker-compose run node10
```

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
