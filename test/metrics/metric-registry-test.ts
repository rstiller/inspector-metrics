/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";
import { SinonSpy, spy } from "sinon";
import * as sinonChai from "sinon-chai";

import { StdClock } from "../../lib/metrics/clock";
import { Counter, MonotoneCounter } from "../../lib/metrics/counter";
import { SimpleGauge } from "../../lib/metrics/gauge";
import { Histogram } from "../../lib/metrics/histogram";
import { Meter } from "../../lib/metrics/meter";
import { Metric } from "../../lib/metrics/metric";
import { MetricRegistry } from "../../lib/metrics/metric-registry";
import { MetricRegistryListener } from "../../lib/metrics/metric-registry-listener";
import { Timer } from "../../lib/metrics/timer";

chai.use(sinonChai);

const expect = chai.expect;
function mapSize(size: number): (map: Map<string, string>) => boolean {
    return (map: Map<string, string>) => map.size === size;
}

@suite
export class MetricRegistryTest {

    @test
    public "check default clock"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getDefaultClock()).to.be.not.null;

        const clock = new StdClock();

        expect(registry.getDefaultClock()).to.not.equal(clock);
        registry.setDefaultClock(clock);
        expect(registry.getDefaultClock()).to.equal(clock);
    }

    @test
    public "check monotone and non-monotone counters"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getCounterList()).to.have.lengthOf(0);
        expect(registry.getMonotoneCounterList()).to.have.lengthOf(0);
        expect(registry.getMetrics()).to.satisfy(mapSize(0));

        registry.newCounter("counter1");

        expect(registry.getCounterList()).to.have.lengthOf(1);
        expect(registry.getMonotoneCounterList()).to.have.lengthOf(0);
        expect(registry.getMetrics()).to.satisfy(mapSize(1));

        registry.newMonotoneCounter("monotone-counter1");

        expect(registry.getCounterList()).to.have.lengthOf(1);
        expect(registry.getMonotoneCounterList()).to.have.lengthOf(1);
        expect(registry.getMetrics()).to.satisfy(mapSize(2));
    }

    @test
    public "add, set, remove and check counters"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getCounters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));

        const counter = registry.newCounter("counter1");
        expect(counter).to.be.not.null;
        expect(counter).to.be.instanceof(Counter);

        expect(registry.getCounters()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getCounter("counter1")).to.be.equal(counter);
        expect(registry.getMetric("counter1")).to.be.equal(counter);

        registry.removeCounter("counter1");

        expect(registry.getCounters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getCounter("counter1")).to.not.exist;
        expect(registry.getMetric("counter1")).to.not.exist;

        registry.register("counter1", counter);

        expect(registry.getCounters()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getCounter("counter1")).to.be.equal(counter);
        expect(registry.getMetric("counter1")).to.be.equal(counter);

        registry.removeMetric("counter1");

        expect(registry.getCounters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getCounter("counter1")).to.not.exist;
        expect(registry.getMetric("counter1")).to.not.exist;
    }

    @test
    public "add, set, remove and check counters with fluent interface"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getCounters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));

        const counter = registry.newCounter("counter1");
        expect(counter).to.be.not.null;
        expect(counter).to.be.instanceof(Counter);

        expect(registry.getCounters()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getCounter("counter1")).to.be.equal(counter);
        expect(registry.getMetric("counter1")).to.be.equal(counter);

        registry
            .removeCounter("counter1")
            .register("counter1", counter);

        expect(registry.getCounters()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getCounter("counter1")).to.be.equal(counter);
        expect(registry.getMetric("counter1")).to.be.equal(counter);

        registry.removeMetric("counter1");

        expect(registry.getCounters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getCounter("counter1")).to.not.exist;
        expect(registry.getMetric("counter1")).to.not.exist;
    }

    @test
    public "add, set, remove and check monotone counters"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getCounterList()).to.have.lengthOf(0);
        expect(registry.getMonotoneCounterList()).to.have.lengthOf(0);
        expect(registry.getMetrics()).to.satisfy(mapSize(0));

        const counter = registry.newMonotoneCounter("monotone-counter1");
        expect(counter).to.be.not.null;
        expect(counter).to.be.instanceof(MonotoneCounter);

        expect(registry.getMonotoneCounterList()).to.have.lengthOf(1);
        expect(registry.getCounterList()).to.have.lengthOf(0);
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getCounter("monotone-counter1")).to.be.equal(counter);
        expect(registry.getMonotoneCountersByName("monotone-counter1")[0]).to.be.equal(counter);
        expect(registry.getMetric("monotone-counter1")).to.be.equal(counter);

        registry.removeCounter("monotone-counter1");

        expect(registry.getMonotoneCounterList()).to.have.lengthOf(0);
        expect(registry.getCounters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getCounter("monotone-counter1")).to.not.exist;
        expect(registry.getMonotoneCountersByName("monotone-counter1")).to.have.lengthOf(0);
        expect(registry.getMetric("monotone-counter1")).to.not.exist;

        registry.register("monotone-counter1", counter);

        expect(registry.getMonotoneCounterList()).to.have.lengthOf(1);
        expect(registry.getCounters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getMonotoneCountersByName("monotone-counter1")[0]).to.be.equal(counter);
        expect(registry.getCounter("monotone-counter1")).to.be.equal(counter);
        expect(registry.getMetric("monotone-counter1")).to.be.equal(counter);

        registry.removeMetric("monotone-counter1");

        expect(registry.getMonotoneCounterList()).to.have.lengthOf(0);
        expect(registry.getCounters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getMonotoneCountersByName("monotone-counter1")).to.have.lengthOf(0);
        expect(registry.getCounter("monotone-counter1")).to.not.exist;
        expect(registry.getMetric("monotone-counter1")).to.not.exist;
    }

    @test
    public "add, set, remove and check monotone counters with fluent interface"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getCounterList()).to.have.lengthOf(0);
        expect(registry.getMonotoneCounterList()).to.have.lengthOf(0);
        expect(registry.getMetrics()).to.satisfy(mapSize(0));

        const counter = registry.newMonotoneCounter("monotone-counter1");
        expect(counter).to.be.not.null;
        expect(counter).to.be.instanceof(MonotoneCounter);

        expect(registry.getMonotoneCounterList()).to.have.lengthOf(1);
        expect(registry.getCounterList()).to.have.lengthOf(0);
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getCounter("monotone-counter1")).to.be.equal(counter);
        expect(registry.getMonotoneCountersByName("monotone-counter1")[0]).to.be.equal(counter);
        expect(registry.getMetric("monotone-counter1")).to.be.equal(counter);

        registry
            .removeCounter("monotone-counter1")
            .register("monotone-counter1", counter);

        expect(registry.getMonotoneCounterList()).to.have.lengthOf(1);
        expect(registry.getCounters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getMonotoneCountersByName("monotone-counter1")[0]).to.be.equal(counter);
        expect(registry.getCounter("monotone-counter1")).to.be.equal(counter);
        expect(registry.getMetric("monotone-counter1")).to.be.equal(counter);

        registry.removeMetric("monotone-counter1");

        expect(registry.getMonotoneCounterList()).to.have.lengthOf(0);
        expect(registry.getCounters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getMonotoneCountersByName("monotone-counter1")).to.have.lengthOf(0);
        expect(registry.getCounter("monotone-counter1")).to.not.exist;
        expect(registry.getMetric("monotone-counter1")).to.not.exist;
    }

    @test
    public "add, set, remove and check hdr-histograms"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getHistograms()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));

        const histogram = registry.newHdrHistogram("histogram1");
        expect(histogram).to.be.not.null;
        expect(histogram).to.be.instanceof(Histogram);

        expect(registry.getHistograms()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getHistogram("histogram1")).to.be.equal(histogram);
        expect(registry.getMetric("histogram1")).to.be.equal(histogram);

        registry.removeHistogram("histogram1");

        expect(registry.getHistograms()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getHistogram("histogram1")).to.not.exist;
        expect(registry.getMetric("histogram1")).to.not.exist;

        registry.register("histogram1", histogram);

        expect(registry.getHistograms()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getHistogram("histogram1")).to.be.equal(histogram);
        expect(registry.getMetric("histogram1")).to.be.equal(histogram);

        registry.removeMetric("histogram1");

        expect(registry.getHistograms()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getHistogram("histogram1")).to.not.exist;
        expect(registry.getMetric("histogram1")).to.not.exist;
    }

    @test
    public "add, set, remove and check hdr-histograms with fluent interface"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getHistograms()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));

        const histogram = registry.newHdrHistogram("histogram1");
        expect(histogram).to.be.not.null;
        expect(histogram).to.be.instanceof(Histogram);

        expect(registry.getHistograms()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getHistogram("histogram1")).to.be.equal(histogram);
        expect(registry.getMetric("histogram1")).to.be.equal(histogram);

        registry
            .removeHistogram("histogram1")
            .register("histogram1", histogram);

        expect(registry.getHistograms()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getHistogram("histogram1")).to.be.equal(histogram);
        expect(registry.getMetric("histogram1")).to.be.equal(histogram);

        registry.removeMetric("histogram1");

        expect(registry.getHistograms()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getHistogram("histogram1")).to.not.exist;
        expect(registry.getMetric("histogram1")).to.not.exist;
    }

    @test
    public "add, set, remove and check histograms"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getHistograms()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));

        const histogram = registry.newHistogram("histogram1");
        expect(histogram).to.be.not.null;
        expect(histogram).to.be.instanceof(Histogram);

        expect(registry.getHistograms()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getHistogram("histogram1")).to.be.equal(histogram);
        expect(registry.getMetric("histogram1")).to.be.equal(histogram);

        registry.removeHistogram("histogram1");

        expect(registry.getHistograms()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getHistogram("histogram1")).to.not.exist;
        expect(registry.getMetric("histogram1")).to.not.exist;

        registry.register("histogram1", histogram);

        expect(registry.getHistograms()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getHistogram("histogram1")).to.be.equal(histogram);
        expect(registry.getMetric("histogram1")).to.be.equal(histogram);

        registry.removeMetric("histogram1");

        expect(registry.getHistograms()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getHistogram("histogram1")).to.not.exist;
        expect(registry.getMetric("histogram1")).to.not.exist;
    }

    @test
    public "add, set, remove and check histograms with fluent interface"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getHistograms()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));

        const histogram = registry.newHistogram("histogram1");
        expect(histogram).to.be.not.null;
        expect(histogram).to.be.instanceof(Histogram);

        expect(registry.getHistograms()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getHistogram("histogram1")).to.be.equal(histogram);
        expect(registry.getMetric("histogram1")).to.be.equal(histogram);

        registry
            .removeHistogram("histogram1")
            .register("histogram1", histogram);

        expect(registry.getHistograms()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getHistogram("histogram1")).to.be.equal(histogram);
        expect(registry.getMetric("histogram1")).to.be.equal(histogram);

        registry.removeMetric("histogram1");

        expect(registry.getHistograms()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getHistogram("histogram1")).to.not.exist;
        expect(registry.getMetric("histogram1")).to.not.exist;
    }

    @test
    public "add, set, remove and check meters"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getMeters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));

        const meter = registry.newMeter("meter1");
        expect(meter).to.be.not.null;
        expect(meter).to.be.instanceof(Meter);

        expect(registry.getMeters()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getMeter("meter1")).to.be.equal(meter);
        expect(registry.getMetric("meter1")).to.be.equal(meter);

        registry.removeMeter("meter1");

        expect(registry.getMeters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getMeter("meter1")).to.not.exist;
        expect(registry.getMetric("meter1")).to.not.exist;

        registry.register("meter1", meter);

        expect(registry.getMeters()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getMeter("meter1")).to.be.equal(meter);
        expect(registry.getMetric("meter1")).to.be.equal(meter);

        registry.removeMetric("meter1");

        expect(registry.getMeters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getMeter("meter1")).to.not.exist;
        expect(registry.getMetric("meter1")).to.not.exist;
    }

    @test
    public "add, set, remove and check meters with fluent interface"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getMeters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));

        const meter = registry.newMeter("meter1");
        expect(meter).to.be.not.null;
        expect(meter).to.be.instanceof(Meter);

        expect(registry.getMeters()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getMeter("meter1")).to.be.equal(meter);
        expect(registry.getMetric("meter1")).to.be.equal(meter);

        registry
            .removeMeter("meter1")
            .register("meter1", meter);

        expect(registry.getMeters()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getMeter("meter1")).to.be.equal(meter);
        expect(registry.getMetric("meter1")).to.be.equal(meter);

        registry.removeMetric("meter1");

        expect(registry.getMeters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getMeter("meter1")).to.not.exist;
        expect(registry.getMetric("meter1")).to.not.exist;
    }

    @test
    public "check mix of histograms and hdr-histograms"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getHistograms()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));

        registry.newHistogram("histogram1");
        registry.newHdrHistogram("hdr-histogram1");

        expect(registry.getHistograms()).to.satisfy(mapSize(2));
        expect(registry.getMetrics()).to.satisfy(mapSize(2));

        registry.removeHistogram("histogram1");

        expect(registry.getHistograms()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));

        registry.removeHistogram("hdr-histogram1");

        expect(registry.getHistograms()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
    }

    @test
    public "add, set, remove and check timers"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getTimers()).to.satisfy(mapSize(0));

        const timer = registry.newTimer("timer1");
        expect(timer).to.be.not.null;
        expect(timer).to.be.instanceof(Timer);

        expect(registry.getTimers()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getTimer("timer1")).to.be.equal(timer);
        expect(registry.getMetric("timer1")).to.be.equal(timer);

        registry.removeTimer("timer1");

        expect(registry.getTimers()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getTimer("timer1")).to.not.exist;
        expect(registry.getMetric("timer1")).to.not.exist;

        registry.register("timer1", timer);

        expect(registry.getTimers()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getTimer("timer1")).to.be.equal(timer);
        expect(registry.getMetric("timer1")).to.be.equal(timer);

        registry.removeMetric("timer1");

        expect(registry.getTimers()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getTimer("timer1")).to.not.exist;
        expect(registry.getMetric("timer1")).to.not.exist;
    }

    @test
    public "add, set, remove and check timers with fluent interface"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getTimers()).to.satisfy(mapSize(0));

        const timer = registry.newTimer("timer1");
        expect(timer).to.be.not.null;
        expect(timer).to.be.instanceof(Timer);

        expect(registry.getTimers()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getTimer("timer1")).to.be.equal(timer);
        expect(registry.getMetric("timer1")).to.be.equal(timer);

        registry
            .removeTimer("timer1")
            .register("timer1", timer);

        expect(registry.getTimers()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getTimer("timer1")).to.be.equal(timer);
        expect(registry.getMetric("timer1")).to.be.equal(timer);

        registry.removeMetric("timer1");

        expect(registry.getTimers()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getTimer("timer1")).to.not.exist;
        expect(registry.getMetric("timer1")).to.not.exist;
    }

    @test
    public "add metric set"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getCounters()).to.satisfy(mapSize(0));
        const counter = registry.newCounter("counter1");
        expect(registry.getCounters()).to.satisfy(mapSize(1));

        registry.register("set1", registry);

        expect(registry.getCounters()).to.satisfy(mapSize(2));
        expect(registry.getMetrics()).to.satisfy(mapSize(2));
        expect(registry.getCounter("counter1")).to.be.equal(counter);
        expect(registry.getCounter("set1.counter1")).to.be.equal(counter);
    }

    @test
    public "check name factory"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getCounters()).to.satisfy(mapSize(0));

        registry.setNameFactory(() => "constant-name");
        const counter = registry.newCounter("counter1");
        registry.register("set1", registry);

        expect(registry.getCounters()).to.satisfy(mapSize(2));
        expect(registry.getMetrics()).to.satisfy(mapSize(2));
        expect(registry.getCounter("counter1")).to.be.equal(counter);
        expect(registry.getCounter("constant-name")).to.be.equal(counter);
    }

    @test
    public "add, set, remove and check gauges"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getGauges()).to.satisfy(mapSize(0));
        const gauge = new SimpleGauge();
        registry.register("gauge1", gauge);

        expect(registry.getGauges()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getGauge("gauge1")).to.be.equal(gauge);
        expect(registry.getMetric("gauge1")).to.be.equal(gauge);

        registry.removeGauge("gauge1");

        expect(registry.getGauges()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getGauge("gauge1")).to.not.exist;
        expect(registry.getMetric("gauge1")).to.not.exist;

        registry.register("gauge1", gauge);

        expect(registry.getGauges()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getGauge("gauge1")).to.be.equal(gauge);
        expect(registry.getMetric("gauge1")).to.be.equal(gauge);

        registry.removeMetric("gauge1");

        expect(registry.getGauges()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getGauge("gauge1")).to.not.exist;
        expect(registry.getMetric("gauge1")).to.not.exist;
    }

    @test
    public "add, set, remove and check gauges with fluent interface"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getGauges()).to.satisfy(mapSize(0));
        const gauge = new SimpleGauge();

        // should only register gauge one time
        registry
            .register("gauge1", gauge)
            .removeGauge("gauge1")
            .register("gauge1", gauge);

        expect(registry.getGauges()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getGauge("gauge1")).to.be.equal(gauge);
        expect(registry.getMetric("gauge1")).to.be.equal(gauge);

        registry.removeMetric("gauge1");

        expect(registry.getGauges()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getGauge("gauge1")).to.not.exist;
        expect(registry.getMetric("gauge1")).to.not.exist;
    }

    @test
    public "check groups"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        const counter = registry.newCounter("counter1", "group");
        const histogram = registry.newHistogram("histogram1", "group");
        const meter = registry.newMeter("meter1", "group");
        const timer = registry.newTimer("timer1", "group");
        const gauge = new SimpleGauge();
        registry.register("gauge1", gauge, "group");

        expect(counter.getGroup()).to.equal("group");
        expect(gauge.getGroup()).to.equal("group");
        expect(histogram.getGroup()).to.equal("group");
        expect(meter.getGroup()).to.equal("group");
        expect(timer.getGroup()).to.equal("group");
    }

    @test
    public "check listeners"(): void {
        const registry: MetricRegistry = new MetricRegistry();
        const listener: MetricRegistryListener = {
            metricAdded: (name: string, metric: Metric) => {},
            metricRemoved: (name: string, metric: Metric) => {},
        };
        const metricAddedSpy: SinonSpy = spy(listener.metricAdded);
        const metricRemovedSpy: SinonSpy = spy(listener.metricRemoved);
        listener.metricAdded = metricAddedSpy;
        listener.metricRemoved = metricRemovedSpy;

        const registration = registry.addListener(listener);

        expect(metricAddedSpy.callCount).to.equal(0);
        expect(metricRemovedSpy.callCount).to.equal(0);

        const counter = registry.newCounter("counter1");
        const histogram = registry.newHistogram("histogram1");
        const meter = registry.newMeter("meter1");
        const timer = registry.newTimer("timer1");
        const gauge = new SimpleGauge();
        registry.register("gauge1", gauge);

        expect(metricAddedSpy.callCount).to.equal(5);
        expect(metricRemovedSpy.callCount).to.equal(0);

        let call1 = metricAddedSpy.getCall(0).args;
        let call2 = metricAddedSpy.getCall(1).args;
        let call3 = metricAddedSpy.getCall(2).args;
        let call4 = metricAddedSpy.getCall(3).args;
        let call5 = metricAddedSpy.getCall(4).args;

        expect(call1[0]).to.equal("counter1");
        expect(call2[0]).to.equal("histogram1");
        expect(call3[0]).to.equal("meter1");
        expect(call4[0]).to.equal("timer1");
        expect(call5[0]).to.equal("gauge1");

        expect(call1[1]).to.equal(counter);
        expect(call2[1]).to.equal(histogram);
        expect(call3[1]).to.equal(meter);
        expect(call4[1]).to.equal(timer);
        expect(call5[1]).to.equal(gauge);

        registry.removeCounter("counter1");
        registry.removeGauge("gauge1");
        registry.removeHistogram("histogram1");
        registry.removeMeter("meter1");
        registry.removeTimer("timer1");

        expect(metricAddedSpy.callCount).to.equal(5);
        expect(metricRemovedSpy.callCount).to.equal(5);

        call1 = metricRemovedSpy.getCall(0).args;
        call2 = metricRemovedSpy.getCall(1).args;
        call3 = metricRemovedSpy.getCall(2).args;
        call4 = metricRemovedSpy.getCall(3).args;
        call5 = metricRemovedSpy.getCall(4).args;

        expect(call1[0]).to.equal("counter1");
        expect(call2[0]).to.equal("gauge1");
        expect(call3[0]).to.equal("histogram1");
        expect(call4[0]).to.equal("meter1");
        expect(call5[0]).to.equal("timer1");

        expect(call1[1]).to.equal(counter);
        expect(call2[1]).to.equal(gauge);
        expect(call3[1]).to.equal(histogram);
        expect(call4[1]).to.equal(meter);
        expect(call5[1]).to.equal(timer);

        registration.remove();

        registry.newCounter("counter1");
        registry.register("gauge1", gauge);
        registry.newHistogram("histogram1");
        registry.newMeter("meter1");
        registry.newTimer("timer1");

        expect(metricAddedSpy.callCount).to.equal(5);
        expect(metricRemovedSpy.callCount).to.equal(5);
    }

    @test
    public "check name building with registerMetric"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        const counter = registry.newCounter("test_counter", "test_group", "test_counter_desc");
        expect(counter.getName()).to.be.equal("test_counter");
        expect(counter.getGroup()).to.be.equal("test_group");
        expect(counter.getDescription()).to.be.equal("test_counter_desc");

        const hdr = registry.newHdrHistogram("test_hdr", 1, 10, 5, "test_group", "test_hdr_desc");
        expect(hdr.getName()).to.be.equal("test_hdr");
        expect(hdr.getGroup()).to.be.equal("test_group");
        expect(hdr.getDescription()).to.be.equal("test_hdr_desc");

        const histogram = registry.newHistogram("test_histogram", "test_group", undefined, "test_histogram_desc");
        expect(histogram.getName()).to.be.equal("test_histogram");
        expect(histogram.getGroup()).to.be.equal("test_group");
        expect(histogram.getDescription()).to.be.equal("test_histogram_desc");

        const meter = registry.newMeter("test_meter", "test_group", undefined, undefined, "test_meter_desc");
        expect(meter.getName()).to.be.equal("test_meter");
        expect(meter.getGroup()).to.be.equal("test_group");
        expect(meter.getDescription()).to.be.equal("test_meter_desc");

        const monotoneCounter = registry.newMonotoneCounter(
            "test_monotoneCounter", "test_group", "test_monotoneCounter_desc");
        expect(monotoneCounter.getName()).to.be.equal("test_monotoneCounter");
        expect(monotoneCounter.getGroup()).to.be.equal("test_group");
        expect(monotoneCounter.getDescription()).to.be.equal("test_monotoneCounter_desc");

        const timer = registry.newTimer("test_timer", "test_group", undefined, undefined, "test_timer_desc");
        expect(timer.getName()).to.be.equal("test_timer");
        expect(timer.getGroup()).to.be.equal("test_group");
        expect(timer.getDescription()).to.be.equal("test_timer_desc");
    }

}
