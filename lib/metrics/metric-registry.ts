import "source-map-support/register";

import { Clock, StdClock } from "./clock";
import { Counter, MonotoneCounter } from "./counter";
import { Buckets } from "./counting";
import { Gauge } from "./gauge";
import { HdrHistogram } from "./hdr-histogram";
import { Histogram } from "./histogram";
import { Meter } from "./meter";
import { BaseMetric, Metric } from "./metric";
import { MetricRegistryListener } from "./metric-registry-listener";
import { MetricSet } from "./metric-set";
import { Reservoir, SlidingWindowReservoir } from "./reservoir";
import { Timer } from "./timer";

export type NameFactory = (baseName: string, metricName: string, metric: Metric) => string;

/**
 * Represents a registration of a {@link MetricRegistryListener}.
 * This instance can be used to safely remove the listener from registry again.
 *
 * @export
 * @class MetricRegistryListenerRegistration
 */
export class MetricRegistryListenerRegistration {

    /**
     * Creates an instance of MetricRegistryListenerRegistration.
     *
     * @param {MetricRegistryListener} listener
     * @param {MetricRegistry} registry
     * @memberof MetricRegistryListenerRegistration
     */
    public constructor(private listener: MetricRegistryListener, private registry: MetricRegistry) {}

    /**
     * Removes the managed listener from the metric registry.
     *
     * @returns {this}
     * @memberof MetricRegistryListenerRegistration
     */
    public remove(): this {
        this.registry.removeListener(this.listener);
        return this;
    }

}

/**
 * Proxy object for a metric (one metric can be registered with multiple names e.g. in different groups).
 *
 * @export
 * @class MetricRegistration
 * @template T
 */
export class MetricRegistration<T extends Metric> {

    /**
     * The metric instance.
     *
     * @type {T}
     * @memberof MetricRegistration
     */
    public metricRef: T;
    /**
     * The name the metric is registered with.
     *
     * @type {string}
     * @memberof MetricRegistration
     */
    public name: string;

    /**
     * Creates an instance of MetricRegistration.
     *
     * @param {T} metricRef
     * @memberof MetricRegistration
     */
    public constructor(metricRef: T) {
        this.metricRef = metricRef;
        this.name = metricRef.getName();
    }

}

/**
 * A metric registry manages metric instances.
 *
 * @export
 * @class MetricRegistry
 * @extends {BaseMetric}
 * @implements {MetricSet}
 */
export class MetricRegistry extends BaseMetric implements MetricSet {

    /**
     * Determines if the specified object is a {@link Counter} or references one.
     *
     * @static
     * @param {*} instance
     * @returns {instance is Counter}
     * @memberof MetricRegistry
     */
    public static isCounter(instance: any): instance is Counter {
        return instance instanceof Counter || instance.metricRef instanceof Counter;
    }

    /**
     * Determines if the specified object is a {@link MonotoneCounter} or {@link Counter} or references one of them.
     *
     * @static
     * @param {*} instance
     * @returns {instance is MonotoneCounter}
     * @memberof MetricRegistry
     */
    public static isMonotoneCounter(instance: any): instance is MonotoneCounter {
        return instance instanceof MonotoneCounter || instance.metricRef instanceof MonotoneCounter;
    }

    /**
     * Determines if the specified object is a {@link MonotoneCounter} or references one.
     *
     * @static
     * @param {*} instance
     * @returns {instance is MonotoneCounter}
     * @memberof MetricRegistry
     */
    public static isPureMonotoneCounter(instance: any): instance is MonotoneCounter {
        return (instance instanceof MonotoneCounter || instance.metricRef instanceof MonotoneCounter) &&
                !MetricRegistry.isCounter(instance);
    }

    /**
     * Determines if the specified object is a {@link Histogram} or references one.
     *
     * @static
     * @param {*} instance
     * @returns {instance is Histogram}
     * @memberof MetricRegistry
     */
    public static isHistogram(instance: any): instance is Histogram {
        return instance instanceof Histogram || instance.metricRef instanceof Histogram;
    }

    /**
     * Determines if the specified object is a {@link Meter} or references one.
     *
     * @static
     * @param {*} instance
     * @returns {instance is Meter}
     * @memberof MetricRegistry
     */
    public static isMeter(instance: any): instance is Meter {
        return instance instanceof Meter || instance.metricRef instanceof Meter;
    }

    /**
     * Determines if the specified object is a {@link Timer} or references one.
     *
     * @static
     * @param {*} instance
     * @returns {instance is Timer}
     * @memberof MetricRegistry
     */
    public static isTimer(instance: any): instance is Timer {
        return instance instanceof Timer || instance.metricRef instanceof Timer;
    }

    /**
     * Determines if the specified object is a {@link Gauge} or references one.
     *
     * @static
     * @template T
     * @param {*} instance
     * @returns {instance is Gauge<T>}
     * @memberof MetricRegistry
     */
    public static isGauge<T>(instance: any): instance is Gauge<T> {
        const directGauge: boolean = !!instance.getValue && instance.getValue instanceof Function;
        const gaugeRegistration =   !!instance.metricRef &&
                                    !!instance.metricRef.getValue &&
                                    instance.metricRef.getValue instanceof Function;
        return directGauge || gaugeRegistration;
    }

    /**
     * Determines if the specified object is a {@link MetricSet}.
     *
     * @static
     * @param {*} instance
     * @returns {instance is MetricSet}
     * @memberof MetricRegistry
     */
    public static isMetricSet(instance: any): instance is MetricSet {
        return !!instance.getMetrics && instance.getMetrics instanceof Function;
    }

    /**
     * Standard function to generate the name for a metric.
     *
     * @private
     * @static
     * @param {string} baseName
     * @param {string} metricName
     * @param {Metric} metric
     * @returns {string}
     * @memberof MetricRegistry
     */
    private static defaultNameFactory(baseName: string, metricName: string, metric: Metric): string {
        return baseName + "." + metricName;
    }

    /**
     * Default clock instance if no clock instance if provided.
     *
     * @private
     * @type {Clock}
     * @memberof MetricRegistry
     */
    private defaultClock: Clock = new StdClock();
    /**
     * A collection metric references.
     *
     * @private
     * @type {Array<MetricRegistration<Metric>>}
     * @memberof MetricRegistry
     */
    private metrics: Array<MetricRegistration<Metric>> = [];
    /**
     * The name factory to build metric names.
     *
     * @private
     * @type {NameFactory}
     * @memberof MetricRegistry
     */
    private nameFactory: NameFactory = MetricRegistry.defaultNameFactory;
    /**
     * A collection of metric listeners.
     *
     * @private
     * @type {MetricRegistryListener[]}
     * @memberof MetricRegistry
     */
    private listeners: MetricRegistryListener[] = [];

    /**
     * Adds the specified listener and returns the corrsponding
     * registration object.
     *
     * @param {MetricRegistryListener} listener
     * @returns {MetricRegistryListenerRegistration}
     * @memberof MetricRegistry
     */
    public addListener(listener: MetricRegistryListener): MetricRegistryListenerRegistration {
        this.listeners.push(listener);
        return new MetricRegistryListenerRegistration(listener, this);
    }

    /**
     * Removes a listener manually.
     *
     * @param {MetricRegistryListener} listener
     * @returns {this}
     * @memberof MetricRegistry
     */
    public removeListener(listener: MetricRegistryListener): this {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            delete this.listeners[index];
        }
        return this;
    }

    /**
     * Sets the default name factory for metric instances.
     *
     * @param {NameFactory} nameFactory
     * @returns {this}
     * @memberof MetricRegistry
     */
    public setNameFactory(nameFactory: NameFactory): this {
        this.nameFactory = nameFactory;
        return this;
    }

    /**
     * Gets the default clock.
     *
     * @returns {Clock}
     * @memberof MetricRegistry
     */
    public getDefaultClock(): Clock {
        return this.defaultClock;
    }

    /**
     * Sets the default clock.
     *
     * @param {Clock} defaultClock
     * @returns {this}
     * @memberof MetricRegistry
     */
    public setDefaultClock(defaultClock: Clock): this {
        this.defaultClock = defaultClock;
        return this;
    }

    /**
     * @deprecated since version 1.3 - use {@link getCounterList} instead
     */
    public getCounters(): Map<string, Counter> {
        const map: Map<string, Counter> = new Map();
        this.metrics
            .filter(MetricRegistry.isCounter)
            .forEach((registration) => map.set(registration.name, registration.metricRef as Counter));
        return map;
    }

    /**
     * @deprecated since version 1.3 - use {@link getGaugeList} instead
     */
    public getGauges(): Map<string, Gauge<any>> {
        const map: Map<string, Gauge<any>> = new Map();
        this.metrics
            .filter(MetricRegistry.isGauge)
            .forEach((registration) => map.set(registration.name, registration.metricRef as Gauge<any>));
        return map;
    }

    /**
     * @deprecated since version 1.3 - use {@link getHistogramList} instead
     */
    public getHistograms(): Map<string, Histogram> {
        const map: Map<string, Histogram> = new Map();
        this.metrics
            .filter(MetricRegistry.isHistogram)
            .forEach((registration) => map.set(registration.name, registration.metricRef as Histogram));
        return map;
    }

    /**
     * @deprecated since version 1.3 - use {@link getMeterList} instead
     */
    public getMeters(): Map<string, Meter> {
        const map: Map<string, Meter> = new Map();
        this.metrics
            .filter(MetricRegistry.isMeter)
            .forEach((registration) => map.set(registration.name, registration.metricRef as Meter));
        return map;
    }

    /**
     * @deprecated since version 1.3 - use {@link getTimerList} instead
     */
    public getTimers(): Map<string, Timer> {
        const map: Map<string, Timer> = new Map();
        this.metrics
            .filter(MetricRegistry.isTimer)
            .forEach((registration) => map.set(registration.name, registration.metricRef as Timer));
        return map;
    }

    /**
     * Gets the list of all managed counter instances.
     *
     * @returns {Counter[]}
     * @memberof MetricRegistry
     */
    public getCounterList(): Counter[] {
        return this.metrics
            .filter(MetricRegistry.isCounter)
            .map((registration) => registration.metricRef as Counter);
    }

    /**
     * Gets the list of all managed monotone counter instances.
     *
     * @returns {MonotoneCounter[]}
     * @memberof MetricRegistry
     */
    public getMonotoneCounterList(): MonotoneCounter[] {
        return this.metrics
            .filter(MetricRegistry.isPureMonotoneCounter)
            .map((registration) => registration.metricRef as MonotoneCounter);
    }

    /**
     * Gets the list of all managed gauge instances.
     *
     * @returns {Array<Gauge<any>>}
     * @memberof MetricRegistry
     */
    public getGaugeList(): Array<Gauge<any>> {
        return this.metrics
            .filter(MetricRegistry.isGauge)
            .map((registration) => registration.metricRef as Gauge<any>);
    }

    /**
     * Gets the list of all managed histogram instances.
     *
     * @returns {Histogram[]}
     * @memberof MetricRegistry
     */
    public getHistogramList(): Histogram[] {
        return this.metrics
            .filter(MetricRegistry.isHistogram)
            .map((registration) => registration.metricRef as Histogram);
    }

    /**
     * Gets the list of all managed meter instances.
     *
     * @returns {Meter[]}
     * @memberof MetricRegistry
     */
    public getMeterList(): Meter[] {
        return this.metrics
            .filter(MetricRegistry.isMeter)
            .map((registration) => registration.metricRef as Meter);
    }

    /**
     * Gets the list of all managed timer instances.
     *
     * @returns {Timer[]}
     * @memberof MetricRegistry
     */
    public getTimerList(): Timer[] {
        return this.metrics
            .filter(MetricRegistry.isTimer)
            .map((registration) => registration.metricRef as Timer);
    }

    /**
     * Gets a mapping of all managed metric instances regardless of the type.
     *
     * @returns {Map<string, Metric>}
     * @memberof MetricRegistry
     */
    public getMetrics(): Map<string, Metric> {
        const map: Map<string, Metric> = new Map();
        this.metrics
            .forEach((registration) => map.set(registration.name, registration.metricRef));
        return map;
    }

    /**
     * Gets a list of all managed metric instances regardless of the type.
     *
     * @returns {Metric[]}
     * @memberof MetricRegistry
     */
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

    /**
     * Gets all mamanged metric instance by name.
     *
     * @param {string} name
     * @returns {Metric[]}
     * @memberof MetricRegistry
     */
    public getMetricsByName(name: string): Metric[] {
        return this.getByName(name);
    }

    /**
     * Gets all managed counter instances by name.
     *
     * @param {string} name
     * @returns {Counter[]}
     * @memberof MetricRegistry
     */
    public getCountersByName(name: string): Counter[] {
        return this.getByName<Counter>(name);
    }

    /**
     * Gets all managed monotone counter instances by name.
     *
     * @param {string} name
     * @returns {MonotoneCounter[]}
     * @memberof MetricRegistry
     */
    public getMonotoneCountersByName(name: string): MonotoneCounter[] {
        return this.getByName<MonotoneCounter>(name);
    }

    /**
     * Gets all managed gauge instances by name.
     *
     * @param {string} name
     * @returns {Array<Gauge<any>>}
     * @memberof MetricRegistry
     */
    public getGaugesByName(name: string): Array<Gauge<any>> {
        return this.getByName<Gauge<any>>(name);
    }

    /**
     * Gets all managed histogram instances by name.
     *
     * @param {string} name
     * @returns {Histogram[]}
     * @memberof MetricRegistry
     */
    public getHistogramsByname(name: string): Histogram[] {
        return this.getByName<Histogram>(name);
    }

    /**
     * Gets all managed meter instances by name.
     *
     * @param {string} name
     * @returns {Meter[]}
     * @memberof MetricRegistry
     */
    public getMetersByName(name: string): Meter[] {
        return this.getByName<Meter>(name);
    }

    /**
     * Gets all managed timer instances by name.
     *
     * @param {string} name
     * @returns {Timer[]}
     * @memberof MetricRegistry
     */
    public getTimersByName(name: string): Timer[] {
        return this.getByName<Timer>(name);
    }

    /**
     * @deprecated since version 1.3 - use {@link removeMetrics} instead
     */
    public removeMetric(name: string): this {
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
        return this;
    }

    /**
     * Removes all managed metric instances by name regardless of the type.
     *
     * @param {string} name
     * @returns {this}
     * @memberof MetricRegistry
     */
    public removeMetrics(name: string): this {
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
        return this;
    }

    /**
     * @deprecated since version 1.3 - use {@link removeMetrics} instead
     */
    public removeCounter(name: string): this {
        return this.removeMetric(name);
    }

    /**
     * @deprecated since version 1.3 - use {@link removeMetrics} instead
     */
    public removeGauge(name: string): this {
        return this.removeMetric(name);
    }

    /**
     * @deprecated since version 1.3 - use {@link removeMetrics} instead
     */
    public removeHistogram(name: string): this {
        return this.removeMetric(name);
    }

    /**
     * @deprecated since version 1.3 - use {@link removeMetrics} instead
     */
    public removeMeter(name: string): this {
        return this.removeMetric(name);
    }

    /**
     * @deprecated since version 1.3 - use {@link removeMetrics} instead
     */
    public removeTimer(name: string): this {
        return this.removeMetric(name);
    }

    /**
     * Builds a new counter with the given name and adds it
     * to the registry.
     *
     * @param {string} name
     * @param {string} [group=null]
     * @param {string} [description=null]
     * @returns {Counter}
     * @memberof MetricRegistry
     */
    public newCounter(name: string, group: string = null, description: string = null): Counter {
        const counter = new Counter(name, description);
        this.registerMetric(counter, group, description);
        return counter;
    }

    /**
     * Builds a new monotone counter with the given name and adds it
     * to the registry.
     *
     * @param {string} name
     * @param {string} [group=null]
     * @param {string} [description=null]
     * @returns {MonotoneCounter}
     * @memberof MetricRegistry
     */
    public newMonotoneCounter(name: string, group: string = null, description: string = null): MonotoneCounter {
        const counter = new MonotoneCounter(name, description);
        this.registerMetric(counter, group, description);
        return counter;
    }

    /**
     * Builds a new meter with the given name and adds it
     * to the registry.
     *
     * @param {string} name
     * @param {string} [group=null]
     * @param {Clock} [clock=this.defaultClock]
     * @param {number} [sampleRate=1]
     * @param {string} [description=null]
     * @returns {Meter}
     * @memberof MetricRegistry
     */
    public newMeter(
        name: string,
        group: string = null,
        clock: Clock = this.defaultClock,
        sampleRate: number = 1,
        description: string = null): Meter {

        const meter = new Meter(clock, sampleRate, name, description);
        this.registerMetric(meter, group, description);
        return meter;
    }

    /**
     * Builds a new hdr-histogram with the given name and adds it
     * to the registry.
     *
     * @param {string} name
     * @param {number} [lowest=1] is the lowest possible number that can be recorded
     * @param {number} [max=100] is the maximum number that can be recorded
     * @param {number} [figures=3]
     *      the number of figures in a decimal number that will be maintained, must be between 1 and 5 (inclusive)
     * @param {string} [group=null]
     * @param {string} [description=null]
     * @param {Reservoir} [reservoir=null]
     * @returns {HdrHistogram}
     * @memberof MetricRegistry
     */
    public newHdrHistogram(
        name: string,
        lowest: number = 1,
        max: number = 100,
        figures: number = 3,
        group: string = null,
        description: string = null,
        buckets: Buckets = new Buckets()): HdrHistogram {

        const histogram = new HdrHistogram(lowest, max, figures, name, description, buckets);
        this.registerMetric(histogram, group, description);
        return histogram;
    }

    /**
     * Builds a new histogram with the given name and adds it
     * to the registry.
     *
     * @param {string} name
     * @param {string} [group=null]
     * @param {string} [description=null]
     * @param {Reservoir} [reservoir=null]
     * @returns {Histogram}
     * @memberof MetricRegistry
     */
    public newHistogram(
        name: string,
        group: string = null,
        reservoir: Reservoir = null,
        description: string = null,
        buckets: Buckets = new Buckets()): Histogram {

        if (!reservoir) {
            reservoir = new SlidingWindowReservoir(1024);
        }
        const histogram = new Histogram(reservoir, name, description, buckets);
        this.registerMetric(histogram, group, description);
        return histogram;
    }

    /**
     * Builds a new timer with the given name and adds it
     * to the registry.
     *
     * @param {string} name
     * @param {string} [group=null]
     * @param {string} [description=null]
     * @param {Clock} [clock=this.defaultClock]
     * @param {Reservoir} [reservoir=null]
     * @returns {Timer}
     * @memberof MetricRegistry
     */
    public newTimer(
        name: string,
        group: string = null,
        clock: Clock = this.defaultClock,
        reservoir: Reservoir = null,
        description: string = null,
        buckets: Buckets = new Buckets()): Timer {

        if (!reservoir) {
            reservoir = new SlidingWindowReservoir(1024);
        }
        const timer = new Timer(clock, reservoir, name, description, buckets);
        this.registerMetric(timer, group, description);
        return timer;
    }

    /**
     * Registers the given metric under it's name in this registry.
     *
     * If the metric is a metric-set the child-metrics are
     * registered using their names the name of the metric-set is set as group.
     *
     * @param {Metric} metric
     * @param {string} [group=null]
     * @returns {this}
     * @memberof MetricRegistry
     */
    public registerMetric(metric: Metric, group: string = null, description: string = null): this {
        if (!!group) {
            metric.setGroup(group);
        }

        if (!!description) {
            metric.setDescription(description);
        }

        if (metric instanceof Meter ||
            metric instanceof Counter ||
            metric instanceof MonotoneCounter ||
            MetricRegistry.isGauge<any>(metric) ||
            metric instanceof Histogram ||
            metric instanceof Timer) {
            this.metrics.push(new MetricRegistration(metric));
            this.fireMetricAdded(metric.getName(), metric);
        } else if (MetricRegistry.isMetricSet(metric)) {
            metric.getMetricList().forEach((m: Metric) => {
                m.setGroup(metric.getName());
                this.registerMetric(m);
            });
        }
        return this;
    }

    /**
     * Registeres a metric by name
     *
     * @param {string} name
     * @param {Metric} metric
     * @param {string} [group=null]
     * @deprecated since version 1.5 - use {@link registerMetric} instead
     * @returns {this}
     * @memberof MetricRegistry
     */
    public register(name: string, metric: Metric, group: string = null, description: string = null): this {
        if (!!group) {
            metric.setGroup(group);
        }
        if (!!description) {
            metric.setDescription(description);
        }

        metric.setName(this.generateName(name, metric));

        if (metric instanceof Meter ||
            metric instanceof Counter ||
            metric instanceof MonotoneCounter ||
            MetricRegistry.isGauge<any>(metric) ||
            metric instanceof Histogram ||
            metric instanceof Timer) {
            this.metrics.push(new MetricRegistration(metric));
            this.fireMetricAdded(name, metric);
        } else if (MetricRegistry.isMetricSet(metric)) {
            metric.getMetrics().forEach((m: Metric) => {
                const metricName = this.nameFactory(name, m.getName(), m);
                this.register(metricName, m);
            });
        }
        return this;
    }

    /**
     * Finds the first metric instance by name.
     *
     * @private
     * @template T
     * @param {string} name
     * @returns {T}
     * @memberof MetricRegistry
     */
    private getFirstByName<T extends Metric>(name: string): T {
        const arr: Metric[] = this.getByName(name);
        if (arr.length === 0) {
            return null;
        }
        return arr[0] as T;
    }

    /**
     * Gets all metric instances by name.
     *
     * @private
     * @template T
     * @param {string} name
     * @returns {T[]}
     * @memberof MetricRegistry
     */
    private getByName<T extends Metric>(name: string): T[] {
        return this.metrics
            .filter((metric) => metric.name === name)
            .map((metric) => metric.metricRef) as T[];
    }

    /**
     * Builds the name of the metric.
     *
     * @private
     * @param {string} name
     * @param {Metric} metric
     * @returns {string}
     * @memberof MetricRegistry
     */
    private generateName(name: string, metric: Metric): string {
        if (!!metric.getGroup()) {
            return `${metric.getGroup()}.${name}`;
        }
        return name;
    }

    /**
     * Invokes all metric listeners when a new metric was added.
     *
     * @private
     * @param {string} name
     * @param {Metric} metric
     * @memberof MetricRegistry
     */
    private fireMetricAdded(name: string, metric: Metric): void {
        this.listeners.forEach((listener) => listener.metricAdded(name, metric));
    }

    /**
     * Invokes all metric listeners when a metric was removed.
     *
     * @private
     * @param {string} name
     * @param {Metric} metric
     * @memberof MetricRegistry
     */
    private fireMetricRemoved(name: string, metric: Metric): void {
        this.listeners.forEach((listener) => listener.metricRemoved(name, metric));
    }
}
