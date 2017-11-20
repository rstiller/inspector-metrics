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
    <a href="https://david-dm.org/rstiller/inspector-vm">
        <img src="https://img.shields.io/david/rstiller/inspector-vm.svg" alt="Dependencies Status">
    </a>
</p>

## install

This library is meant to be used with `typescript` / `nodejs`.

`npm install --save inspector-vm`

## basic usage

```typescript
import { MetricRegistry } from "inspector-metrics";
import { V8MemoryMetrics, V8GCMetrics } from "inspector-vm";

// get a registry
const registry: MetricRegistry = ...;

// instance the memory metric, contains
//   - space statistics
//   - memory statistics
const memoryMetrics: V8MemoryMetrics = new V8MemoryMetrics("v8", registry.getDefaultClock());
//   - gc statistics
const gcMetrics: V8GCMetrics = new V8GCMetrics("gc", registry.getDefaultClock());

// metric is registered und the name "v8"
// defaults to group "gc"
registry.register(memoryMetrics.getName(), memoryMetrics);

// setup reporter ...

// note that unstopped metrics can cause the application to keep running
gcMetrics.stop();
memoryMetrics.stop();
```

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
