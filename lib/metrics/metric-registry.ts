import "source-map-support/register";

import { Clock, StdClock } from "./clock";
import { Counter } from "./counter";
import { Gauge } from "./gauge";
import { Histogram } from "./histogram";
import { Meter } from "./meter";
import { BaseMetric, Metric } from "./metric";
import { MetricRegistryListener } from "./metric-registry-listener";
import { MetricSet } from "./metric-set";
import { Reservoir, SlidingWindowReservoir } from "./reservoir";
import { Timer } from "./timer";

export type NameFactory = (baseName: string, metricName: string, metric: Metric) => string;

export class MetricRegistryListenerRegistration {

    public constructor(private listener: MetricRegistryListener, private registry: MetricRegistry) {}

    public remove(): void {
        this.registry.removeListener(this.listener);
    }

}

export class MetricRegistration<T extends Metric> {

    public metricRef: T;
    public name: string;

    public constructor(metricRef: T) {
        this.metricRef = metricRef;
        this.name = metricRef.getName();
    }

}

export class MetricRegistry extends BaseMetric implements MetricSet {

    private static defaultNameFactory(baseName: string, metricName: string, metric: Metric): string {
        return baseName + "." + metricName;
    }

    private defaultClock: Clock = new StdClock();
    private metrics: Array<MetricRegistration<Metric>> = [];
    private nameFactory: NameFactory = MetricRegistry.defaultNameFactory;
    private listeners: MetricRegistryListener[] = [];

    public addListener(listener: MetricRegistryListener): MetricRegistryListenerRegistration {
        this.listeners.push(listener);
        return new MetricRegistryListenerRegistration(listener, this);
    }

    public removeListener(listener: MetricRegistryListener): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            delete this.listeners[index];
        }
    }

    public setNameFactory(nameFactory: NameFactory): void {
        this.nameFactory = nameFactory;
    }

    public getDefaultClock(): Clock {
        return this.defaultClock;
    }

    public setDefaultClock(defaultClock: Clock): void {
        this.defaultClock = defaultClock;
    }

    /**
     * @deprecated since version 1.3 - use {@link getCounterList} instead
     */
    public getCounters(): Map<string, Counter> {
        const map: Map<string, Counter> = new Map();
        this.metrics
            .filter(this.isCounter)
            .forEach((registration) => map.set(registration.name, registration.metricRef as Counter));
        return map;
    }

    /**
     * @deprecated since version 1.3 - use {@link getGaugeList} instead
     */
    public getGauges(): Map<string, Gauge<any>> {
        const map: Map<string, Gauge<any>> = new Map();
        this.metrics
            .filter(this.isGauge)
            .forEach((registration) => map.set(registration.name, registration.metricRef as Gauge<any>));
        return map;
    }

    /**
     * @deprecated since version 1.3 - use {@link getHistogramList} instead
     */
    public getHistograms(): Map<string, Histogram> {
        const map: Map<string, Histogram> = new Map();
        this.metrics
            .filter(this.isHistogram)
            .forEach((registration) => map.set(registration.name, registration.metricRef as Histogram));
        return map;
    }

    /**
     * @deprecated since version 1.3 - use {@link getMeterList} instead
     */
    public getMeters(): Map<string, Meter> {
        const map: Map<string, Meter> = new Map();
        this.metrics
            .filter(this.isMeter)
            .forEach((registration) => map.set(registration.name, registration.metricRef as Meter));
        return map;
    }

    /**
     * @deprecated since version 1.3 - use {@link getTimerList} instead
     */
    public getTimers(): Map<string, Timer> {
        const map: Map<string, Timer> = new Map();
        this.metrics
            .filter(this.isTimer)
            .forEach((registration) => map.set(registration.name, registration.metricRef as Timer));
        return map;
    }

    public getCounterList(): Counter[] {
        return this.metrics
            .filter(this.isCounter)
            .map((registration) => registration.metricRef as Counter);
    }

    public getGaugeList(): Array<Gauge<any>> {
        return this.metrics
            .filter(this.isGauge)
            .map((registration) => registration.metricRef as Gauge<any>);
    }

    public getHistogramList(): Histogram[] {
        return this.metrics
            .filter(this.isHistogram)
            .map((registration) => registration.metricRef as Histogram);
    }

    public getMeterList(): Meter[] {
        return this.metrics
            .filter(this.isMeter)
            .map((registration) => registration.metricRef as Meter);
    }

    public getTimerList(): Timer[] {
        return this.metrics
            .filter(this.isTimer)
            .map((registration) => registration.metricRef as Timer);
    }

    public getMetrics(): Map<string, Metric> {
        const map: Map<string, Metric> = new Map();
        this.metrics
            .forEach((registration) => map.set(registration.name, registration.metricRef));
        return map;
    }

    public getMetricList(): Metric[] {
        return this.metrics.map((metric) => metric.metricRef);
    }

    /**
     * @deprecated since version 1.3 - use {@link getMetricsByName} instead
     */
    public getMetric(name: string): Metric {
        return this.getFirstByName(name);
    }

    /**
     * @deprecated since version 1.3 - use {@link getCountersByName} instead
     */
    public getCounter(name: string): Counter {
        return this.getFirstByName<Counter>(name);
    }

    /**
     * @deprecated since version 1.3 - use {@link getGaugesByName} instead
     */
    public getGauge(name: string): Gauge<any> {
        return this.getFirstByName<Gauge<any>>(name);
    }

    /**
     * @deprecated since version 1.3 - use {@link getHistogramsByName} instead
     */
    public getHistogram(name: string): Histogram {
        return this.getFirstByName<Histogram>(name);
    }

    /**
     * @deprecated since version 1.3 - use {@link getMetersByName} instead
     */
    public getMeter(name: string): Meter {
        return this.getFirstByName<Meter>(name);
    }

    /**
     * @deprecated since version 1.3 - use {@link getTimersByName} instead
     */
    public getTimer(name: string): Timer {
        return this.getFirstByName<Timer>(name);
    }

    public getMetricsByName(name: string): Metric[] {
        return this.getByName(name);
    }

    public getCountersByName(name: string): Counter[] {
        return this.getByName<Counter>(name);
    }

    public getGaugesByName(name: string): Array<Gauge<any>> {
        return this.getByName<Gauge<any>>(name);
    }

    public getHistogramsByname(name: string): Histogram[] {
        return this.getByName<Histogram>(name);
    }

    public getMetersByName(name: string): Meter[] {
        return this.getByName<Meter>(name);
    }

    public getTimersByName(name: string): Timer[] {
        return this.getByName<Timer>(name);
    }

    /**
     * @deprecated since version 1.3 - use {@link removeMetrics} instead
     */
    public removeMetric(name: string): void {
        const metrics: Metric[] = this.getByName(name);

        if (metrics.length > 0) {
            const index = this.metrics
                .map((m) => m.metricRef)
                .indexOf(metrics[0], 0);
            if (index > -1) {
                this.metrics.splice(index, 1);
            }
            this.fireMetricRemoved(name, metrics[0]);
        }
    }

    public removeMetrics(name: string): void {
        const metrics: Metric[] = this.getByName(name);

        metrics.forEach((metric) => {
            const index = this.metrics
                .map((m) => m.metricRef)
                .indexOf(metric, 0);
            if (index > -1) {
                this.metrics.splice(index, 1);
            }
            this.fireMetricRemoved(name, metric);
        });
    }

    /**
     * @deprecated since version 1.3 - use {@link removeMetrics} instead
     */
    public removeCounter(name: string): void {
        this.removeMetric(name);
    }

    /**
     * @deprecated since version 1.3 - use {@link removeMetrics} instead
     */
    public removeGauge(name: string): void {
        this.removeMetric(name);
    }

    /**
     * @deprecated since version 1.3 - use {@link removeMetrics} instead
     */
    public removeHistogram(name: string): void {
        this.removeMetric(name);
    }

    /**
     * @deprecated since version 1.3 - use {@link removeMetrics} instead
     */
    public removeMeter(name: string): void {
        this.removeMetric(name);
    }

    /**
     * @deprecated since version 1.3 - use {@link removeMetrics} instead
     */
    public removeTimer(name: string): void {
        this.removeMetric(name);
    }

    public newCounter(name: string, group: string = null): Counter {
        const counter = new Counter(name);
        if (!!group) {
            counter.setGroup(group);
        }
        this.register(counter.getName(), counter);
        return counter;
    }

    public newMeter(name: string, group: string = null, clock: Clock = this.defaultClock, sampleRate: number = 1): Meter {
        const meter = new Meter(clock, sampleRate, name);
        if (!!group) {
            meter.setGroup(group);
        }
        this.register(meter.getName(), meter);
        return meter;
    }

    public newHistogram(name: string, group: string = null, reservoir: Reservoir = null): Histogram {
        if (!reservoir) {
            reservoir = new SlidingWindowReservoir(1024);
        }
        const histogram = new Histogram(reservoir, name);
        if (!!group) {
            histogram.setGroup(group);
        }
        this.register(histogram.getName(), histogram);
        return histogram;
    }

    public newTimer(name: string, group: string = null, clock: Clock = this.defaultClock, reservoir: Reservoir = null): Timer {
        if (!reservoir) {
            reservoir = new SlidingWindowReservoir(1024);
        }
        const timer = new Timer(clock, reservoir, name);
        if (!!group) {
            timer.setGroup(group);
        }
        this.register(timer.getName(), timer);
        return timer;
    }

    public register(name: string, metric: Metric, group: string = null): void {
        if (!!group) {
            metric.setGroup(group);
        }

        metric.setName(this.generateName(name, metric));

        if (metric instanceof Meter ||
            metric instanceof Counter ||
            this.isGauge(metric) ||
            metric instanceof Histogram ||
            metric instanceof Timer) {
            this.metrics.push(new MetricRegistration(metric));
            this.fireMetricAdded(name, metric);
        } else if (this.isMetricSet(metric)) {
            metric.getMetrics().forEach((m: Metric) => {
                const metricName = this.nameFactory(name, m.getName(), m);
                this.register(metricName, m);
            });
        }
    }

    private getFirstByName<T extends Metric>(name: string): T {
        const arr: Metric[] = this.getByName(name);
        if (arr.length === 0) {
            return null;
        }
        return arr[0] as T;
    }

    private getByName<T extends Metric>(name: string): T[] {
        return this.metrics
            .filter((metric) => metric.name === name)
            .map((metric) => metric.metricRef) as T[];
    }

    private generateName(name: string, metric: Metric): string {
        if (!!metric.getGroup()) {
            return `${metric.getGroup()}.${name}`;
        }
        return name;
    }

    private isCounter(instance: any): instance is Counter {
        return instance.metricRef instanceof Counter;
    }

    private isHistogram(instance: any): instance is Histogram {
        return instance.metricRef instanceof Histogram;
    }

    private isMeter(instance: any): instance is Meter {
        return instance.metricRef instanceof Meter;
    }

    private isTimer(instance: any): instance is Timer {
        return instance.metricRef instanceof Timer;
    }

    private isGauge<T>(instance: any): instance is Gauge<T> {
        const directGauge: boolean = !!instance.getValue && instance.getValue instanceof Function;
        const gaugeRegistration: boolean = !!instance.metricRef && !!instance.metricRef.getValue && instance.metricRef.getValue instanceof Function;
        return directGauge || gaugeRegistration;
    }

    private isMetricSet(instance: any): instance is MetricSet {
        return !!instance.getMetrics && instance.getMetrics instanceof Function;
    }

    private fireMetricAdded(name: string, metric: Metric): void {
        this.listeners.forEach((listener) => listener.metricAdded(name, metric));
    }

    private fireMetricRemoved(name: string, metric: Metric): void {
        this.listeners.forEach((listener) => listener.metricRemoved(name, metric));
    }

}
