# inspector-vm

NodeJS VM Metric Collector

<p align="center">
    <a href="https://www.npmjs.org/package/inspector-vm">
        <img src="https://img.shields.io/npm/v/inspector-vm.svg" alt="NPM Version">
    </a>
    <a href="https://www.npmjs.org/package/inspector-vm">
        <img src="https://img.shields.io/npm/l/inspector-vm.svg" alt="License">
    </a>
    <a href="https://travis-ci.org/rstiller/inspector-vm">
        <img src="http://img.shields.io/travis/rstiller/inspector-vm/master.svg" alt="Build Status">
    </a>
</p>

Take a look at the [Documentation](https://rstiller.github.io/inspector-metrics/).

## install

This library is meant to be used with `typescript` / `nodejs`.

`npm install --save inspector-vm`

## basic usage

```typescript
import { MetricRegistry } from "inspector-metrics";
import {
    V8EventLoop,
    V8MemoryMetrics,
    V8GCMetrics,
    V8ProcessMetrics,
} from "inspector-vm";

// get a registry
const registry: MetricRegistry = ...;

// instance the memory metric, contains
//   - space statistics
//   - memory statistics
const memoryMetrics: V8MemoryMetrics = new V8MemoryMetrics("v8");
//   - gc statistics
const gc: V8GCMetrics = new V8GCMetrics("gc", registry.getDefaultClock());
//   - event loop delay / latency
const eventLoop: V8EventLoop = new V8EventLoop("eventLoop");
//   - cpu_usage (system, user, total)
//   - active_handles
//   - active_requests
const processMetric: V8ProcessMetrics = new V8ProcessMetrics("process");

// metric is registered und the name "v8"
registry.registerMetric(memoryMetrics);
// metric is registered und the name "gc"
registry.registerMetric(gc);
// metric is registered und the name "eventLoop"
registry.registerMetric(eventLoop);
// metric is registered und the name "process"
registry.registerMetric(processMetric);

// setup reporter ...

// note that unstopped metrics can cause the application to keep running
memoryMetrics.stop();
gc.stop();
eventLoop.stop();
processMetric.stop();
```

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
