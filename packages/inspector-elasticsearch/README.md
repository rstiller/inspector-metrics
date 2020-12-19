# inspector-elasticsearch
Typescript [Metrics Reporter](https://github.com/rstiller/inspector-metrics/blob/master/lib/metrics/metric-reporter.ts) for
[elasticsearch](https://www.elastic.co/de/products/elasticsearch).

<p align="center">
    <a href="https://www.npmjs.org/package/inspector-elasticsearch">
        <img src="https://img.shields.io/npm/v/inspector-elasticsearch.svg" alt="NPM Version">
    </a>
    <a href="https://www.npmjs.org/package/inspector-elasticsearch">
        <img src="https://img.shields.io/npm/l/inspector-elasticsearch.svg" alt="License">
    </a>
    <a href="https://travis-ci.org/rstiller/inspector-elasticsearch">
        <img src="http://img.shields.io/travis/rstiller/inspector-elasticsearch/master.svg" alt="Build Status">
    </a>
</p>

This library is made for [inspector-metrics](https://github.com/rstiller/inspector-metrics) node module and
is meant to be used with `typescript` / `nodejs`.  
It uses the [official elasticsearch js client](https://www.npmjs.com/package/@elastic/elasticsearch).

Take a look at the [Documentation](https://rstiller.github.io/inspector-metrics/).

## install

`npm install --save inspector-elasticsearch`

## basic usage

From version `2.6.0` onwards this library uses the [official elasticsearch js client](https://www.npmjs.com/package/@elastic/elasticsearch) instead of the [legacy elasticsearch js client](https://www.npmjs.com/package/elasticsearch).

```typescript
import { MetricRegistry } from "inspector-metrics";
import { ElasticsearchMetricReporter } from "inspector-elasticsearch";
import { ClientOptions } from "@elastic/elasticsearch";

const clientOptions: ClientOptions = {
    node: "http://localhost:9200",
};
// instance the elasticsearch reporter
const reporter: ElasticsearchMetricReporter = new ElasticsearchMetricReporter({
    clientOptions,
    indexnameDeterminator: ElasticsearchMetricReporter.dailyIndex(`metrics`),
});
const registry: MetricRegistry = new MetricRegistry();

// add the registry to the reporter
reporter.addMetricRegistry(registry);
// start reporting
await reporter.start();
```

For users of versions before `2.6.0`:  
```typescript
import { MetricRegistry } from "inspector-metrics";
import { ElasticsearchMetricReporter } from "inspector-elasticsearch";
import { ConfigOptions } from "elasticsearch";

const clientOptions: ConfigOptions = {
    apiVersion: "6.0",
    host: "localhost:9200",
};
// instance the elasticsearch reporter
const reporter: ElasticsearchMetricReporter = new ElasticsearchMetricReporter({
    clientOptions,
    indexnameDeterminator: ElasticsearchMetricReporter.dailyIndex(`metrics`),
    log: null,
    metricDocumentBuilder: ElasticsearchMetricReporter.defaultDocumentBuilder(),
    typeDeterminator: ElasticsearchMetricReporter.defaultTypeDeterminator(),
});
const registry: MetricRegistry = new MetricRegistry();

// add the registry to the reporter
reporter.addMetricRegistry(registry);
// start reporting
await reporter.start();
```

### determine the indexname for a metric

```typescript
import { MetricRegistry } from "inspector-metrics";
import {
    ElasticsearchMetricReporter,
    MetricInfoDeterminator
} from "inspector-elasticsearch";
import { ClientOptions } from "@elastic/elasticsearch";

const clientOptions: ClientOptions = { ... };
// computes the name of the index using the timestamp of the metric
const indexnameDeterminator: MetricInfoDeterminator = (
    registry: MetricRegistry,
    metric: Metric,
    type: MetricType,
    date: Date) => {
    
    const day = date.getDate();
    const dayPrefix: string = (day >= 10) ? "" : "0";
    const month = date.getMonth() + 1;
    const monthPrefix: string = (month >= 10) ? "" : "0";
    return `metrics-${date.getFullYear()}-${monthPrefix}${month}-${dayPrefix}${day}`;
};
// the indexname generator needs to be specified when instancing the reporter
const reporter: ElasticsearchMetricReporter = new ElasticsearchMetricReporter({
    clientOptions,
    indexnameDeterminator,
});
```

### build a metric document

```typescript
import { MetricRegistry, Tags } from "inspector-metrics";
import {
    ElasticsearchMetricReporter,
    MetricDocumentBuilder,
    MetricType
} from "inspector-elasticsearch";
import { ClientOptions } from "@elastic/elasticsearch";

const clientOptions: ClientOptions = { ... };
// only build documents for counter metrics
const metricDocumentBuilder: MetricDocumentBuilder = (
    registry: MetricRegistry,
    metric: Metric,
    type: MetricType,
    timestamp: Date,
    commonTags: Tags) => {

    if (metric instanceof Counter) {
        const tags = commonTags;
        const name = metric.getName();
        const group = metric.getGroup();
        return { name, group, tags, timestamp, values: { count: metric.getCount() }, type };

    } else {
        // null values will not be reported / published
        return null;
    }
};

// the document builder needs to be specified when instancing the reporter
const reporter: ElasticsearchMetricReporter = new ElasticsearchMetricReporter({
    clientOptions,
    metricDocumentBuilder,
});
```

### multi process support (nodejs cluster)

By default forked processes are sending the metrics as inter-process message  
to the master process. The `ElasticsearchMetricReporter` is listening for those messages  
and report the metrics from the other processes.  

To disable this behavior set the `DisabledClusterOptions` when creating an instance.  

In each case you should set the `pid` as reporter tag.  

```typescript
import { tagsToMap, DisabledClusterOptions } from "inspector-metrics";
import { ElasticsearchMetricReporter } from "inspector-elasticsearch";
import { ClientOptions } from "@elastic/elasticsearch";

const clientOptions: ClientOptions = {
    apiVersion: "6.0",
    host: "localhost:9200",
};
// instance the elasticsearch reporter
const reporter: ElasticsearchMetricReporter = new ElasticsearchMetricReporter({
    clientOptions,
    clusterOptions: new DisabledClusterOptions(),
});

// set "pid" to process id
reporter.setTags(tagsToMap({
    pid: `${process.pid}`,
}));
```

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
