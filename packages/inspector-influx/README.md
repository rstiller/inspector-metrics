# inspector-influx
Typescript [Metrics Reporter](https://github.com/rstiller/inspector-metrics/blob/master/lib/metrics/metric-reporter.ts) for
[InfluxDB](https://docs.influxdata.com/influxdb/).

This library is made for [inspector-metrics](https://github.com/rstiller/inspector-metrics) node module and for nodejs only.
It uses [node-influx](https://github.com/node-influx/node-influx) as influxdb client.

## install

`npm install --save inspector-influx`

## basic usage

```typescript
import { InfluxMetricReporter } from "inspector-influx";
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

const reporter: InfluxMetricReporter = new InfluxMetricReporter(dbConfig);
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

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
