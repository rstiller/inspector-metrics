# inspector-metrics
Typescript Metrics Library (copied from http://metrics.dropwizard.io)

## install

`npm install --save inspector-metrics`

## basic usage

At least a `MetricRegistry`, a `Metric` and a `MetricReporter` is necessary
to use the library.

Supported metric types:
* Counter
* Gauge
* Histogram
* Meter
* Timer

The library ships with a default `console` `MetricReporter`.

Some other reporter:
* [Influx](https://github.com/rstiller/inspector-influx)

```typescript
import { LoggerReporter, MetricRegistry, Timer } from "inspector-metrics";

// a registry is a collection of metric objects
const registry = new MetricRegistry();
// the reporter prints the stats
const reporter = new LoggerReporter(global.console);
// a new timer instance
const requests: Timer = registry.newTimer("requests");

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

### Counter

```typescript
import { Counter, MetricRegistry } from "inspector-metrics";

const registry = new MetricRegistry();
const requestCount: Counter = registry.newCounter("requestCount");

// +1
requestCount.increment(1);

// -1
requestCount.decrement(1);

// =0
requestCount.getCount();

requestCount.reset();
```

### Gauge

```typescript
import { Gauge, MetricRegistry, SimpleGauge } from "inspector-metrics";

class ArrayLengthGauge extends Gauge<number> {

    public constructor(private a: Array<any>) {}

    public getValue(): number {
        return this.a.length;
    }

}

const registry = new MetricRegistry();
const queueSize: Gauge<number> = new SimpleGauge();
let myArray: number[] = [];
const arrayLength: Gauge<number> = new ArrayLengthGauge(myArray);

registry.register("requestCount", queueSize);
registry.register("arrayLength", arrayLength);

queueSize.setValue(12345);

// 12345
queueSize.getValue();

myArray.push(1);
myArray.push(2);
myArray.push(3);

// 3
arrayLength.getValue();
```

### Histogram

```typescript
import { Histogram, MetricRegistry, Snapshot } from "inspector-metrics";

const registry = new MetricRegistry();
const entityCount: Histogram = registry.newHistogram("requestCount");

entityCount.update(12345);

// 12345
entityCount.getValue();

const snapshot: Snapshot = entityCount.getSnapshot();

// mean count
const mean: number = snapshot.getMean();
```

### Meter

```typescript
import { Meter, MetricRegistry } from "inspector-metrics";

const registry = new MetricRegistry();
const callCount: Meter = registry.newMeter("callCount");

callCount.mark(1);

const count: number = callCount.getCount();
const m15: number = callCount.get15MinuteRate();
const m5: number = callCount.get5MinuteRate();
const m1: number = callCount.get1MinuteRate();
const mean: number = callCount.getMeanRate();
```

### Timer

```typescript
import { MetricRegistry, MILLISECOND, Snapshot, StopWatch, Timer } from "inspector-metrics";

const registry = new MetricRegistry();
const callStats: Timer = registry.newTimer("callStats");

callStats.addDuration(100, MILLISECOND);

// 1
const count: number = callStats.getCount();
// ~1
const m15: number = callStats.get15MinuteRate();
// ~1
const m5: number = callStats.get5MinuteRate();
// ~1
const m1: number = callStats.get1MinuteRate();
// ~1
const mean: number = callStats.getMeanRate();

let snapshot: Snapshot = callStats.getSnapshot();

// some value around 100000000 (100ms in nanoseconds)
const mean: number = snapshot.getMean();

const timer: StopWatch = callStats.newStopWatch();

timer.start();
// 100ms has passed
timer.stop();

snapshot = callStats.getSnapshot();
// snapshot gets updated through stop-watch ...
snapshot.getMean();

callStats.time(() => {
    // some time has passed
});

snapshot = callStats.getSnapshot();
// snapshot gets updated through time function ...
snapshot.getMean();
```

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
