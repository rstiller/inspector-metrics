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
    <a href="https://github.com/rstiller/inspector-metrics/tree/master/packages/inspector-influx">
        <img src="https://github.com/rstiller/inspector-metrics/workflows/CI/badge.svg" alt="CI Status">
    </a>
</p>

This library is made for [inspector-metrics](https://github.com/rstiller/inspector-metrics) node module and
is meant to be used with `nodejs`.  
It uses [node-influx](https://github.com/node-influx/node-influx) as influxdb client.

Take a look at the [Documentation](https://rstiller.github.io/inspector-metrics/).

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

// need ot wait for the reporter to start
await reporter.start();

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

## reporting events

```typescript
import { InfluxMetricReporter } from "inspector-influx";
import { Event } from "inspector-metrics";

const reporter: InfluxMetricReporter = ...

// need ot wait for the reporter to start before reporting events
await reporter.start();

// build an ad-hoc event
const event = new Event<number>("application_started")
    .setValue(1.0)
    .setTag("mode", "test")
    .setTag("customTag", "specialValue");

// send the event to influxdb
await reporter.reportEvent(event);
```

## multi process support (nodejs cluster)

By default forked processes are sending the metrics as inter-process message  
to the master process. The `InfluxMetricReporter` is listening for those messages  
and report the metrics from the other processes.  

To disable this behavior set the `DisabledClusterOptions` when creating an instance.  

In each case you should set the `pid` as reporter tag.  

```typescript
import { DefaultSender, InfluxMetricReporter } from "inspector-influx";
import { tagsToMap, DisabledClusterOptions, MetricRegistry, Timer } from "inspector-metrics";

const dbConfig = {...};
const sender = new DefaultSender(dbConfig);
const reporter: InfluxMetricReporter = new InfluxMetricReporter({
    clusterOptions: new DisabledClusterOptions(),
    sender,
});

// set "pid" to process id
reporter.setTags(tagsToMap({
    pid: `${process.pid}`,
}));
```

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
