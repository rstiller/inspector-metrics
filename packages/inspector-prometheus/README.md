# inspector-prometheus
Typescript metric reporter for [prometheus](https://prometheus.io).

<p align="center">
    <a href="https://www.npmjs.org/package/inspector-prometheus">
        <img src="https://img.shields.io/npm/v/inspector-prometheus.svg" alt="NPM Version">
    </a>
    <a href="https://www.npmjs.org/package/inspector-prometheus">
        <img src="https://img.shields.io/npm/l/inspector-prometheus.svg" alt="License">
    </a>
    <a href="https://github.com/rstiller/inspector-metrics/tree/master/packages/inspector-prometheus">
        <img src="https://github.com/rstiller/inspector-metrics/workflows/CI/badge.svg" alt="CI Status">
    </a>
</p>

This library is made for [inspector-metrics](https://github.com/rstiller/inspector-metrics)
node module and is meant to be used with `nodejs`.  

All metrics from the [inspector-metrics](https://github.com/rstiller/inspector-metrics) library
can be pushed to a [pushgateway](https://github.com/prometheus/pushgateway) or be exposed with
a custom `/metrics` endpoint in your application.

Take a look at the [Documentation](https://rstiller.github.io/inspector-metrics/).

## install

`npm install --save inspector-prometheus`

## basic usage

`example.ts`
```typescript
import {
    MetricRegistry,
} from "inspector-metrics";

import {
    PrometheusMetricReporter,
} from "inspector-prometheus";

// contains all metrics
const registry = new MetricRegistry();
// exposes the metrics
const reporter = new PrometheusMetricReporter({});

// register the registry within the reporter
reporter.addMetricRegistry(registry);

// common tags for all metrics
const tags = new Map();
tags.set("app_version", "1.0.0");
reporter.setTags(tags);

// a simple request timer used to report response latencies
const requests: Timer = registry.newTimer("requests");
// custom metric tag
requests.setTag("host", "127.0.0.3");

// some server implementation - could be anything KOA, Express, HAPI ...
const server = new Hapi.Server({ host: "0.0.0.0", port: 8080 });

// '/metrics' is the standard route used by prometheus ...
server.route({
    method: "GET",
    path: "/metrics",
    handler(request, h) {
        console.log("reporting metrics");
        return h.response(reporter.getMetricsString())
            .code(200)
            .type("text/plain");
    },
});

// starts the server
server.start();
```

`/etc/prometheus/config.yml`
```yaml
global:
  scrape_interval:     15s
  evaluation_interval: 30s

scrape_configs:
- job_name: test-app
  metrics_path: /metrics
  static_configs:
    - targets:
      - localhost:8080
```

`example metrics report`
```text
# HELP requests request durations for some endpoint
# TYPE requests summary
requests{app_version="1.0.0",host="127.0.0.3",quantile="0.01"} 0
requests{app_version="1.0.0",host="127.0.0.3",quantile="0.05"} 0
requests{app_version="1.0.0",host="127.0.0.3",quantile="0.5"} 999936
requests{app_version="1.0.0",host="127.0.0.3",quantile="0.75"} 999936
requests{app_version="1.0.0",host="127.0.0.3",quantile="0.9"} 1000192
requests{app_version="1.0.0",host="127.0.0.3",quantile="0.95"} 1000192
requests{app_version="1.0.0",host="127.0.0.3",quantile="0.98"} 1999872
requests{app_version="1.0.0",host="127.0.0.3",quantile="0.99"} 2000128
requests{app_version="1.0.0",host="127.0.0.3",quantile="0.999"} 4000000
requests_count{app_version="1.0.0",host="127.0.0.3"} 362
requests_sum{app_version="1.0.0",host="127.0.0.3"} 283998208
```

### reporting options for PrometheusMetricReporter

```typescript
import {
    PrometheusMetricReporter,
} from "inspector-prometheus";

const reporter = new PrometheusMetricReporter({
    includeTimestamp: true,
    emitComments: true,
    useUntyped: false,
});
```

### multi process support (nodejs cluster)

Due to the nature of prometheus scraping multiple processes need to collect  
metrics in order report all metrics of every process.  

Therefore the `PrometheusMetricReporter` implements an internal  
request/response mechanism to gather all metrics from all forked processes  
and wait for the response before serving all metrics data.  

You should set the `pid` as reporter tag to be able to determine  
between the multiple metrics sources.  

Only the master process should serve the metrics to the `prometheus` server.  

```typescript
import * as cluster from "cluster";

import {
    tagsToMap,
} from "inspector-metrics";

import {
    PrometheusMetricReporter,
} from "inspector-prometheus";

const reporter = new PrometheusMetricReporter({});

// set "pid" to process id
reporter.setTags(tagsToMap({
    pid: `${process.pid}`,
}));

if (cluster.isMaster) {
    // some server implementation - could be anything KOA, Express, HAPI ...
    const server = new Hapi.Server({ host: "0.0.0.0", port: 8080 });

    // '/metrics' is the standard route used by prometheus ...
    server.route({
        method: "GET",
        path: "/metrics",
        handler(request, h) {
            console.log("reporting metrics");
            return h.response(reporter.getMetricsString())
                .code(200)
                .type("text/plain");
        },
    });

    // starts the server
    server.start();
}
```

## report metrics with pushgateway

```typescript
import ...; // like in the example above

import {
    PrometheusMetricReporter,
    PushgatewayMetricReporter,
} from "inspector-prometheus";

// contains all metrics
const registry = new MetricRegistry();
// exposes the metrics
const reporter = new PrometheusMetricReporter({});

// register the registry within the reporter
reporter.addMetricRegistry(registry);

const pushReporter = new PushgatewayMetricReporter({
    reporter,

    host: "localhost",
    port: 9091,
    job: "pushgateway",
    instance: "127.0.0.4",
});

// start reporting
await pushReporter.start();
```

### multi process support (nodejs cluster)

By default cluster support is disabled for `PushgatewayMetricReporter`.  
You should set the `pid` as reporter tag.  

```typescript
import {
    tagsToMap,
} from "inspector-metrics";

import {
    PrometheusMetricReporter,
    PushgatewayMetricReporter,
} from "inspector-prometheus";

const reporter = new PrometheusMetricReporter({});
const pushReporter = new PushgatewayMetricReporter({
    reporter,
    ...
});

// set "pid" to process id
reporter.setTags(tagsToMap({
    pid: `${process.pid}`,
}));

// start reporting
await pushReporter.start();
```

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
