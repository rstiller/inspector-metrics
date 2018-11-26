# inspector-carbon
Typescript [Metrics Reporter](https://github.com/rstiller/inspector-metrics/blob/master/lib/metrics/metric-reporter.ts) for
[graphite carbon](https://github.com/graphite-project/carbon).

<p align="center">
    <a href="https://www.npmjs.org/package/inspector-carbon">
        <img src="https://img.shields.io/npm/v/inspector-carbon.svg" alt="NPM Version">
    </a>
    <a href="https://www.npmjs.org/package/inspector-carbon">
        <img src="https://img.shields.io/npm/l/inspector-carbon.svg" alt="License">
    </a>
    <a href="https://travis-ci.org/rstiller/inspector-carbon">
        <img src="http://img.shields.io/travis/rstiller/inspector-carbon/master.svg" alt="Build Status">
    </a>
    <a href="https://david-dm.org/rstiller/inspector-carbon">
        <img src="https://img.shields.io/david/rstiller/inspector-carbon.svg" alt="Dependencies Status">
    </a>
</p>

This library is made for [inspector-metrics](https://github.com/rstiller/inspector-metrics) node module and
is meant to be used with `typescript` / `nodejs`.  
It uses [node-graphite](https://github.com/felixge/node-graphite) as graphite/carbon client.

## install

`npm install --save inspector-carbon`

## basic usage

```typescript
import { MetricRegistry } from "inspector-metrics";
import { CarbonMetricReporter } from "inspector-carbon";

// instance the carbon reporter
const reporter: CarbonMetricReporter = new CarbonMetricReporter({
    host: "plaintext://graphite:2003/",
});
const registry: MetricRegistry = new MetricRegistry();

// add the registry to the reporter
reporter.addMetricRegistry(registry);
// start reporting
reporter.start();
```

### set common tags for all metrics

```typescript
import { MetricRegistry } from "inspector-metrics";
import { CarbonMetricReporter } from "inspector-carbon";

// instance the carbon reporter
const reporter: CarbonMetricReporter = new CarbonMetricReporter({
    host: "plaintext://graphite:2003/",
});

// set common tags for all metrics
reporter.getTags().set("app-name", "my-service");
reporter.getTags().set("app-version", "v1.2.3");
```

## dev

### using the playground

To use the playground you need to have `docker` and `docker-compose` installed.

```bash
npm run compile
# running playground script
playground/playground.sh
```

### view data in grafana

1. Navigate to `http://localhost:3000`
1. Add a new Data Source (type: graphite, username / password: root/root, host / url: http://graphite/)
1. Create a new graph

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
