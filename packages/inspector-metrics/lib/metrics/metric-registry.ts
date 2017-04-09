
import "source-map-support/register";

import { Clock, StdClock } from "./clock";
import { Counter } from "./counter";
import { Gauge } from "./gauge";
import { Histogram } from "./histogram";
import { Meter } from "./meter";
import { BaseMetric, Metric } from "./metric";
import { MetricSet } from "./metric-set";
import { Reservoir, SlidingWindowReservoir } from "./reservoir";
import { Timer } from "./timer";

export type NameFactory = (baseName: string, metricName: string, metric: Metric) => string;

export class MetricRegistry extends BaseMetric implements MetricSet {

    private static defaultNameFactory(baseName: string, metricName: string, metric: Metric): string {
        return baseName + "." + metricName;
    }

    private defaultClock: Clock = new StdClock();
    private counters: Map<string, Counter> = new Map();
    private gauges: Map<string, Gauge<any>> = new Map();
    private histograms: Map<string, Histogram> = new Map();
    private meters: Map<string, Meter> = new Map();
    private timers: Map<string, Timer> = new Map();
    private metrics: Map<string, Metric> = new Map();
    private nameFactory: NameFactory = MetricRegistry.defaultNameFactory;

    public setNameFactory(nameFactory: NameFactory): void {
        this.nameFactory = nameFactory;
    }

    public getDefaultClock(): Clock {
        return this.defaultClock;
    }

    public setDefaultClock(defaultClock: Clock): void {
        this.defaultClock = defaultClock;
    }

    public getCounters(): Map<string, Counter> {
        return this.counters;
    }

    public getGauges(): Map<string, Gauge<any>> {
        return this.gauges;
    }

    public getHistograms(): Map<string, Histogram> {
        return this.histograms;
    }

    public getMeters(): Map<string, Meter> {
        return this.meters;
    }

    public getTimers(): Map<string, Timer> {
        return this.timers;
    }

    public getMetric(name: string): Metric {
        return this.metrics.get(name);
    }

    public getCounter(name: string): Counter {
        return this.counters.get(name);
    }

    public getGauge(name: string): Gauge<any> {
        return this.gauges.get(name);
    }

    public getHistogram(name: string): Histogram {
        return this.histograms.get(name);
    }

    public getMeter(name: string): Meter {
        return this.meters.get(name);
    }

    public getTimer(name: string): Timer {
        return this.timers.get(name);
    }

    public removeMetric(name: string): void {
        this.counters.delete(name);
        this.histograms.delete(name);
        this.meters.delete(name);
        this.metrics.delete(name);
        this.gauges.delete(name);
        this.timers.delete(name);
    }

    public removeCounter(name: string): void {
        this.counters.delete(name);
        this.metrics.delete(name);
    }

    public removeGauge(name: string): void {
        this.gauges.delete(name);
        this.metrics.delete(name);
    }

    public removeHistogram(name: string): void {
        this.histograms.delete(name);
        this.metrics.delete(name);
    }

    public removeMeter(name: string): void {
        this.meters.delete(name);
        this.metrics.delete(name);
    }

    public removeTimer(name: string): void {
        this.timers.delete(name);
        this.metrics.delete(name);
    }

    public getMetrics(): Map<string, Metric> {
        return this.metrics;
    }

    public newCounter(name: string, group: string = ""): Counter {
        const counter = new Counter();
        counter.setGroup(group);
        this.register(name, counter);
        return counter;
    }

    public newMeter(name: string, group: string = "", clock: Clock = this.defaultClock, sampleRate: number = 1): Meter {
        const meter = new Meter(clock, sampleRate);
        meter.setGroup(group);
        this.register(name, meter);
        return meter;
    }

    public newHistogram(name: string, group: string = "", reservoir: Reservoir = null): Histogram {
        if (!reservoir) {
            reservoir = new SlidingWindowReservoir(1024);
        }
        const histogram = new Histogram(reservoir);
        histogram.setGroup(group);
        this.register(name, histogram);
        return histogram;
    }

    public newTimer(name: string, group: string = "", clock: Clock = this.defaultClock, reservoir: Reservoir = null): Timer {
        if (!reservoir) {
            reservoir = new SlidingWindowReservoir(1024);
        }
        const timer = new Timer(clock, reservoir);
        timer.setGroup(group);
        this.register(name, timer);
        return timer;
    }

    public register(name: string, metric: Metric, group: string = null): void {
        if (!!group) {
            metric.setGroup(group);
        }
        if (metric instanceof Meter) {
            this.meters.set(name, metric);
            this.metrics.set(name, metric);
        } else if (metric instanceof Counter) {
            this.counters.set(name, metric);
            this.metrics.set(name, metric);
        } else if (this.isGauge(metric)) {
            this.gauges.set(name, metric);
            this.metrics.set(name, metric);
        } else if (metric instanceof Histogram) {
            this.histograms.set(name, metric);
            this.metrics.set(name, metric);
        } else if (metric instanceof Timer) {
            this.timers.set(name, metric);
            this.metrics.set(name, metric);
        } else if (this.isMetricSet(metric)) {
            const registry = this;
            new Map(metric.getMetrics()).forEach((m: Metric, n: string) => {
                const metricName = this.nameFactory(name, n, m);
                registry.register(metricName, m);
            });
        }
    }

    private isGauge<T>(instance: any): instance is Gauge<T> {
        return !!instance.getValue && instance.getValue instanceof Function;
    }

    private isMetricSet(instance: any): instance is MetricSet {
        return !!instance.getMetrics && instance.getMetrics instanceof Function;
    }

}
