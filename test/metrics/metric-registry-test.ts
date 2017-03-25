
import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import { StdClock } from "../../lib/metrics/clock";
import { Counter } from "../../lib/metrics/counter";
import { SimpleGauge } from "../../lib/metrics/gauge";
import { Histogram } from "../../lib/metrics/histogram";
import { Meter } from "../../lib/metrics/meter";
import { MetricRegistry } from "../../lib/metrics/metric-registry";
import { Timer } from "../../lib/metrics/timer";

const expect = chai.expect;
function mapSize(size: number): Function {
    return (map: Map<string, string>) => map.size === size;
}

@suite("MetricRegistry")
export class MetricRegistryTest {

    @test("check default clock")
    public checkDefaultClock(): void {
        let registry: MetricRegistry = new MetricRegistry();

        expect(registry.getDefaultClock()).to.be.not.null;

        let clock = new StdClock();

        expect(registry.getDefaultClock()).to.not.equal(clock);
        registry.setDefaultClock(clock);
        expect(registry.getDefaultClock()).to.equal(clock);
    }

    @test("add, set, remove and check counters")
    public checkCounters(): void {
        let registry: MetricRegistry = new MetricRegistry();

        expect(registry.getCounters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));

        let counter = registry.newCounter("counter1");
        expect(counter).to.be.not.null;
        expect(counter).to.be.instanceof(Counter);

        expect(registry.getCounters()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getCounter("counter1")).to.be.equal(counter);
        expect(registry.getMetric("counter1")).to.be.equal(counter);

        registry.removeCounter("counter1");

        expect(registry.getCounters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getCounter("counter1")).to.be.undefined;
        expect(registry.getMetric("counter1")).to.be.undefined;

        registry.register("counter1", counter);

        expect(registry.getCounters()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getCounter("counter1")).to.be.equal(counter);
        expect(registry.getMetric("counter1")).to.be.equal(counter);

        registry.removeMetric("counter1");

        expect(registry.getCounters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getCounter("counter1")).to.be.undefined;
        expect(registry.getMetric("counter1")).to.be.undefined;
    }

    @test("add, set, remove and check histograms")
    public checkHistograms(): void {
        let registry: MetricRegistry = new MetricRegistry();

        expect(registry.getHistograms()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));

        let histogram = registry.newHistogram("histogram1");
        expect(histogram).to.be.not.null;
        expect(histogram).to.be.instanceof(Histogram);

        expect(registry.getHistograms()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getHistogram("histogram1")).to.be.equal(histogram);
        expect(registry.getMetric("histogram1")).to.be.equal(histogram);

        registry.removeHistogram("histogram1");

        expect(registry.getHistograms()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getHistogram("histogram1")).to.be.undefined;
        expect(registry.getMetric("histogram1")).to.be.undefined;

        registry.register("histogram1", histogram);

        expect(registry.getHistograms()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getHistogram("histogram1")).to.be.equal(histogram);
        expect(registry.getMetric("histogram1")).to.be.equal(histogram);

        registry.removeMetric("histogram1");

        expect(registry.getHistograms()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getHistogram("histogram1")).to.be.undefined;
        expect(registry.getMetric("histogram1")).to.be.undefined;
    }

    @test("add, set, remove and check meters")
    public checkMeters(): void {
        let registry: MetricRegistry = new MetricRegistry();

        expect(registry.getMeters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));

        let meter = registry.newMeter("meter1");
        expect(meter).to.be.not.null;
        expect(meter).to.be.instanceof(Meter);

        expect(registry.getMeters()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getMeter("meter1")).to.be.equal(meter);
        expect(registry.getMetric("meter1")).to.be.equal(meter);

        registry.removeMeter("meter1");

        expect(registry.getMeters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getMeter("meter1")).to.be.undefined;
        expect(registry.getMetric("meter1")).to.be.undefined;

        registry.register("meter1", meter);

        expect(registry.getMeters()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getMeter("meter1")).to.be.equal(meter);
        expect(registry.getMetric("meter1")).to.be.equal(meter);

        registry.removeMetric("meter1");

        expect(registry.getMeters()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getMeter("meter1")).to.be.undefined;
        expect(registry.getMetric("meter1")).to.be.undefined;
    }

    @test("add, set, remove and check timers")
    public checkTimers(): void {
        let registry: MetricRegistry = new MetricRegistry();

        expect(registry.getTimers()).to.satisfy(mapSize(0));

        let timer = registry.newTimer("timer1");
        expect(timer).to.be.not.null;
        expect(timer).to.be.instanceof(Timer);

        expect(registry.getTimers()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getTimer("timer1")).to.be.equal(timer);
        expect(registry.getMetric("timer1")).to.be.equal(timer);

        registry.removeTimer("timer1");

        expect(registry.getTimers()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getTimer("timer1")).to.be.undefined;
        expect(registry.getMetric("timer1")).to.be.undefined;

        registry.register("timer1", timer);

        expect(registry.getTimers()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getTimer("timer1")).to.be.equal(timer);
        expect(registry.getMetric("timer1")).to.be.equal(timer);

        registry.removeMetric("timer1");

        expect(registry.getTimers()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getTimer("timer1")).to.be.undefined;
        expect(registry.getMetric("timer1")).to.be.undefined;
    }

    @test("add metric set")
    public checkMetricSet(): void {
        let registry: MetricRegistry = new MetricRegistry();

        expect(registry.getCounters()).to.satisfy(mapSize(0));

        let counter = registry.newCounter("counter1");
        registry.register("set1", registry);

        expect(registry.getCounters()).to.satisfy(mapSize(2));
        expect(registry.getMetrics()).to.satisfy(mapSize(2));
        expect(registry.getCounter("counter1")).to.be.equal(counter);
        expect(registry.getCounter("set1.counter1")).to.be.equal(counter);
    }

    @test("check name factory")
    public checkNameFactory(): void {
        let registry: MetricRegistry = new MetricRegistry();

        expect(registry.getCounters()).to.satisfy(mapSize(0));

        registry.setNameFactory(() => "constant-name");
        let counter = registry.newCounter("counter1");
        registry.register("set1", registry);

        expect(registry.getCounters()).to.satisfy(mapSize(2));
        expect(registry.getMetrics()).to.satisfy(mapSize(2));
        expect(registry.getCounter("counter1")).to.be.equal(counter);
        expect(registry.getCounter("constant-name")).to.be.equal(counter);
    }

    @test("add, set, remove and check gauges")
    public checkGauges(): void {
        let registry: MetricRegistry = new MetricRegistry();

        expect(registry.getGauges()).to.satisfy(mapSize(0));

        let gauge = new SimpleGauge();
        registry.register("gauge1", gauge);

        expect(registry.getGauges()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getGauge("gauge1")).to.be.equal(gauge);
        expect(registry.getMetric("gauge1")).to.be.equal(gauge);

        registry.removeGauge("gauge1");

        expect(registry.getGauges()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getGauge("gauge1")).to.be.undefined;
        expect(registry.getMetric("gauge1")).to.be.undefined;

        registry.register("gauge1", gauge);

        expect(registry.getGauges()).to.satisfy(mapSize(1));
        expect(registry.getMetrics()).to.satisfy(mapSize(1));
        expect(registry.getGauge("gauge1")).to.be.equal(gauge);
        expect(registry.getMetric("gauge1")).to.be.equal(gauge);

        registry.removeMetric("gauge1");

        expect(registry.getGauges()).to.satisfy(mapSize(0));
        expect(registry.getMetrics()).to.satisfy(mapSize(0));
        expect(registry.getGauge("gauge1")).to.be.undefined;
        expect(registry.getMetric("gauge1")).to.be.undefined;
    }

}
