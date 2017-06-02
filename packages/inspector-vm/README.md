# inspector-vm

NodeJS VM Metric Collector

dependencies:

* [gc-heap-stats](https://github.com/josefzamrzla/gc-heap-stats)

## install

`npm install --save inspector-vm`

## basic usage

```typescript
import { MetricRegistry } from "inspector-metrics";
import { GCMetrics } from "inspector-vm";

// get a registry
const registry: MetricRegistry = ...;

// instance the memory metric, contains
//   - number of gc runs
//   - space statistics
//   - memory statistics
const gcMetrics: GCMetrics = new GCMetrics("vm", registry.getDefaultClock());

// metric is registered und the name "vm"
// defaults to group "gc"
// GC run statistics are registered under the name vm.gc.runs
registry.register(gcMetrics.getName(), gcMetrics);

// setup reporter ...
```

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
