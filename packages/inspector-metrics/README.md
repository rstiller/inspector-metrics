# inspector-metrics
Monitoring / metric library similar to http://metrics.dropwizard.io

<p align="center">
    <a href="https://www.npmjs.org/package/inspector-metrics">
        <img src="https://img.shields.io/npm/v/inspector-metrics.svg" alt="NPM Version">
    </a>
    <a href="https://www.npmjs.org/package/inspector-metrics">
        <img src="https://img.shields.io/npm/dm/inspector-metrics.svg" alt="Downloads per Month">
    </a>
    <a href="https://www.npmjs.org/package/inspector-metrics">
        <img src="https://img.shields.io/npm/l/inspector-metrics.svg" alt="License">
    </a>
    <a href="https://travis-ci.org/rstiller/inspector-metrics">
        <img src="http://img.shields.io/travis/rstiller/inspector-metrics/master.svg" alt="Build Status">
    </a>
    <a href="https://david-dm.org/rstiller/inspector-metrics">
        <img src="https://img.shields.io/david/rstiller/inspector-metrics.svg" alt="Dependencies Status">
    </a>
</p>

## install

This library is meant to be used with `typescript` / `nodejs`.

`npm install --save inspector-metrics`

## basic usage

At least a `MetricRegistry`, a `Metric` and a `MetricReporter` is necessary
to use the library.

Supported metric types:
* Counter - measures an integer value (e.g. "how many time was my function called, number of bookings in a sales system")
* MonotoneCounter - a monotonically increasing integer value (e.g. "error count")
* Event - ad-hoc event to report events (e.g. "application start / deployment", "batch import started / ended")
* Gauge - measurement of a value (e.g. "number of waiting threads on a resource")
* HdrHistogram - recording and analyzing sampled data value counts across a configurable integer value range with configurable value precision
* Histogram - measures the statistical distribution of all values
* Meter - measures the rate of events over time (e.g. "requests per second")
* Timer - measures call-rate of a function and the distribution of the duration of all calls

There are libraries which collect some metrics:

* [node VM](https://github.com/rstiller/inspector-vm) - collects memory & garbage collection metric for node VM

The library ships with a default `console` `MetricReporter`.

Some other reporter:
* [Carbon / Graphite](https://github.com/rstiller/inspector-carbon)
* [CSV](https://github.com/rstiller/inspector-csv)
* [Elasticsearch](https://github.com/rstiller/inspector-elasticsearch)
* [Influx](https://github.com/rstiller/inspector-influx)
* [Prometheus / Pushgateway](https://github.com/rstiller/inspector-prometheus)

```typescript
import { LoggerReporter, MetricRegistry, Timer } from "inspector-metrics";

// a registry is a collection of metric objects
const registry = new MetricRegistry();
// the reporter prints the stats
const reporter = new LoggerReporter({
    log: global.console,
});
// a new timer instance
const requests: Timer = registry.newTimer("requests");

reporter.addMetricRegistry(registry);
reporter.start();

// example usage
setInterval(() => {
    // should report a few milliseconds
    requests.time(() => {
        let a = 0;
        // tslint:disable-next-line:prefer-const
        let b = 1;
        for (let i = 0; i < 1e6; i++) {
            a = b + i + a;
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

### MonotoneCounter

```typescript
import { MonotoneCounter, MetricRegistry } from "inspector-metrics";

const registry = new MetricRegistry();
const errorCount: MonotoneCounter = registry.newMonotoneCounter("errorCount");

// +1
errorCount.increment(1);

// causes error
errorCount.increment(-1);

// =1
errorCount.getCount();

errorCount.reset();
```

### Event

```typescript
import { BaseMetric, Event, MetricRegistry } from "inspector-metrics";

// common application tags - applied to each metric / event
const tags: Map<string, string> = new Map();
tags.set("application", "project-name");
tags.set("hostname", "127.0.0.4");

// the reporter prints the stats
const reporter = new LoggerReporter({
    log: global.console,
    tags,
});

// not connected to a MetricRegistry like the other metrics
const event = new Event<string>("application_started", "signals an application start")
    .setValue("started")
    .setTag("mode", "test")
    .setTag("component", "main");

// directly send to time-series DB
await reporter.reportEvent(event);
```

### Gauge

```typescript
import { BaseMetric, Gauge, MetricRegistry, SimpleGauge } from "inspector-metrics";

class ArrayLengthGauge extends BaseMetric implements Gauge<number> {

    public constructor(name: string, private a: Array<any>) {
        super();
        this.name = name;
    }

    public getValue(): number {
        return this.a.length;
    }

}

const registry = new MetricRegistry();
const queueSize: Gauge<number> = new SimpleGauge("requestCount");
let myArray: number[] = [];
const arrayLength: Gauge<number> = new ArrayLengthGauge("arrayLength", myArray);

registry.registerMetric(queueSize);
registry.registerMetric(arrayLength);

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
// measures a duration / latency
const requestLatency: Histogram = registry.newHistogram("requestLatency");

requestLatency.update(12345);
requestLatency.update(23456);
requestLatency.update(34567);

// a copy of the current values
const snapshot: Snapshot = requestLatency.getSnapshot();

// mean count
const mean: number = snapshot.getMean();
```

### HdrHistogram

```typescript
import { HdrHistogram, MetricRegistry, Snapshot } from "inspector-metrics";

const registry = new MetricRegistry();
// measures a duration / latency between 1 and 1000000000 nanoseconds
const requestLatency: HdrHistogram = registry.newHdrHistogram("requestLatency", 1, 1000000000);

// 102 microseconds in nanoseconds
requestLatency.update(102000);
// 4.390 milliseconds in nanoseconds
requestLatency.update(4390000);

// only snapshot interface - always uses the current values
// since the native-hdr-histogram is used as a reference
const snapshot: Snapshot = requestLatency.getSnapshot();

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

// works with promise too
await callStats.timeAsync(async () => {
    // some time has passed
});

snapshot = callStats.getSnapshot();
// snapshot gets updated through time function ...
snapshot.getMean();
```

### MetricListeners

```typescript
import { Metric, MetricRegistry, MetricRegistryListener, MetricRegistryListenerRegistration } from "inspector-metrics";

class Listener implements MetricRegistryListener {

    public metricAdded(name: string, metric: Metric): void {
        console.log(`added metric ${name}: ${metric}`);
    }

    public metricRemoved(name: string, metric: Metric): void {
        console.log(`removed metric ${name}: ${metric}`);
    }

}

const registry = new MetricRegistry();
const registration: MetricRegistryListenerRegistration = registry.addListener(new Listener());

// prints "added metric requests: Counter..." via console
registry.newCounter("requests");

// removes the listener
registration.remove();
```

### Metric Groups

Each metric can have a group, which is used to gather different metrics
within metric reporter instances. E.g. if only gauges are used
to gather metrics data a group can be used to report them all as one
measure point with different fields.

```typescript
import { Gauge, MetricRegistry } from "inspector-metrics";

const registry = new MetricRegistry();
// reports the internal storage capacity of a queue
const capacity: Gauge<number> = ...;
// reports the element count in the queue
const queueSize: Gauge<number> = ...;

// all values grouped as buffer
registry.registerMetric(queueSize, "buffer");
registry.registerMetric(capacity, "buffer");
// counts the number of allocations during the execution of the application
registry.newCounter("newAllocations", "buffer");

// the reporter can now report the values as a single measurement point if supported ...
```

## local dev

### compile & test with different nodejs versions

build docker images:  
```bash
docker-compose build
```

run tests:  
```bash
docker-compose run node6
docker-compose run node7
docker-compose run node8
docker-compose run node9
docker-compose run node10
docker-compose run node11
```

### releaseing / publish docs

```text
# check functionality
npm i
npm run build

# release
git commit -am "release of a.b.c"
git push
git tag va.b.c
git push --tags

# publish docs
rm -fr docs/
git branch -D gh-pages
git worktree prune
git worktree list
git worktree add -b gh-pages docs origin/gh-pages
npm run publishDocs

# publish package
npm publish
```

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
