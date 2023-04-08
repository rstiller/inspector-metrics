# inspector-carbon
Typescript [Metrics Reporter](https://github.com/rstiller/inspector-metrics/blob/main/lib/metrics/metric-reporter.ts) for
[graphite carbon](https://github.com/graphite-project/carbon).

<p align="center">
    <a href="https://www.npmjs.org/package/inspector-carbon">
        <img src="https://img.shields.io/npm/v/inspector-carbon.svg" alt="NPM Version">
    </a>
    <a href="https://www.npmjs.org/package/inspector-carbon">
        <img src="https://img.shields.io/npm/l/inspector-carbon.svg" alt="License">
    </a>
    <a href="https://github.com/rstiller/inspector-metrics/tree/main/packages/inspector-carbon">
        <img src="https://github.com/rstiller/inspector-metrics/workflows/CI/badge.svg" alt="CI Status">
    </a>
</p>

This library is made for [inspector-metrics](https://github.com/rstiller/inspector-metrics) node module and
is meant to be used with `nodejs`.  
It uses [node-graphite](https://github.com/felixge/node-graphite) as graphite/carbon client.

Take a look at the [Documentation](https://rstiller.github.io/inspector-metrics/).

## install

`npm install --save inspector-carbon`

## basic usage

```typescript
import { MetricRegistry } from "inspector-metrics";
import { CarbonMetricReporter } from "inspector-carbon";

// instance the carbon reporter
const reporter: CarbonMetricReporter = new CarbonMetricReporter({
    host: "http://graphite-server/",
});
const registry: MetricRegistry = new MetricRegistry();

// add the registry to the reporter
reporter.addMetricRegistry(registry);
// start reporting
await reporter.start();
```

### set common tags for all metrics

```typescript
import { MetricRegistry } from "inspector-metrics";
import { CarbonMetricReporter } from "inspector-carbon";

// instance the carbon reporter
const reporter: CarbonMetricReporter = new CarbonMetricReporter({
    host: "http://graphite-server/",
});

// set common tags for all metrics
reporter.getTags().set("app-name", "my-service");
reporter.getTags().set("app-version", "v1.2.3");
```

### reporting events

```typescript
import { Event, MetricRegistry } from "inspector-metrics";
import { CarbonMetricReporter } from "inspector-carbon";

// instance the carbon reporter
const reporter: CarbonMetricReporter = new CarbonMetricReporter({
    host: "http://graphite-server/",
});

// build an ad-hoc event
const event = new Event<number>("application_started")
    .setValue(1.0)
    .setTag("mode", "test")
    .setTag("customTag", "specialValue");

// send the event to graphite
reporter.reportEvent(event);
```

### multi process support (nodejs cluster)

By default forked processes are sending the metrics as inter-process message  
to the master process. The `CarbonMetricReporter` is listening for those messages  
and reports the metrics from the other processes.  

To disable this behavior set the `DisabledClusterOptions` when creating an instance.  

In each case you should set the `pid` as reporter tag.  

```typescript
import { tagsToMap, DisabledClusterOptions } from "inspector-metrics";
import { CarbonMetricReporter } from "inspector-carbon";

// instance the carbon reporter
const reporter: CarbonMetricReporter = new CarbonMetricReporter({
    clusterOptions: new DisabledClusterOptions(),
    host: "http://graphite-server/",
});

// set "pid" to process id
reporter.setTags(tagsToMap({
    pid: `${process.pid}`,
}));
```

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
