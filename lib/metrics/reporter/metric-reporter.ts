import "source-map-support/register";

import { Clock } from "../clock";
import { Counter, MonotoneCounter } from "../counter";
import { Gauge } from "../gauge";
import { Histogram } from "../histogram";
import { Meter } from "../meter";
import { Metric } from "../metric";
import { MetricRegistry } from "../metric-registry";
import { Taggable } from "../taggable";
import { Timer } from "../timer";
import { MetricEntry } from "./metric-entry";
import { MetricType } from "./metric-type";

/**
 * Helper interface for handling tags.
 */
export interface Tags {
    [key: string]: string;
}

/**
 * Helper interface for reporting runs.
 */
export interface ReportingContext<M> {
    /**
     * The array of metric instance that is currently reported.
     *
     * @type {M[]}
     * @memberof ReportingContext
     */
    metrics: M[];
    /**
     * The registry the metric are registered in.
     *
     * @type {MetricRegistry}
     * @memberof ReportingContext
     */
    readonly registry: MetricRegistry;
    /**
     * The current date.
     *
     * @type {Date}
     * @memberof ReportingContext
     */
    readonly date: Date;
    /**
     * The type of the metrics in the {@link #metrics} array.
     *
     * @type {MetricType}
     * @memberof ReportingContext
     */
    readonly type: MetricType;
}

/**
 * Helper interface for reporting results.
 */
export interface ReportingResult<M, T> {
    /**
     * The metric the result refers to.
     *
     * @type {M}
     * @memberof ReportingResult
     */
    readonly metric: M;
    /**
     * The reporting result - implementation specific.
     *
     * @type {T}
     * @memberof ReportingResult
     */
    readonly result: T;
}

/**
 * Options for the {@link MetricReporter}.
 *
 * @export
 * @interface MetricReporterOptions
 */
export interface MetricReporterOptions {
    /**
     * Clock used to determine the date for the reporting as well as the minimum-reporting timeout feature.
     *
     * @type {Clock}
     * @memberof MetricReporterOptions
     */
    readonly clock?: Clock;
    /**
     * Timeout in minutes a metric need to be included in the report without having changed.
     *
     * @type {number}
     * @memberof MetricReporterOptions
     */
    minReportingTimeout?: number;
    /**
     * Tags for this reporter instance - to be combined with the tags of each metric while reporting.
     *
     * @type {Map<string, string>}
     * @memberof MetricReporterOptions
     */
    tags?: Map<string, string>;
}

/**
 * Base-class for metric-reporter implementations.
 *
 * @export
 * @abstract
 * @class MetricReporter
 */
export abstract class MetricReporter<O extends MetricReporterOptions, T> {

    /**
     * {@link MetricRegistry} instances.
     *
     * @protected
     * @type {MetricRegistry[]}
     * @memberof MetricReporter
     */
    protected readonly metricRegistries: MetricRegistry[] = [];
    /**
     * options for this reporter instance.
     *
     * @protected
     * @type {O}
     * @memberof MetricReporter
     */
    protected readonly options: O;
    /**
     * Keeps track of the reporting states for each metric.
     *
     * @protected
     * @type {Map<number, MetricEntry>}
     * @memberof MetricReporter
     */
    protected readonly metricStates: Map<number, MetricEntry> = new Map();

    /**
     * Creates an instance of MetricReporter.
     *
     * @param {O} options
     * @param {Map<string, string>} [tags=new Map()]
     *          tags for this reporter instance - to be combined with the tags of each metric while reporting
     * @param {Clock} [clock=new StdClock()]
     *          clock used to determine the date for the reporting as well as the minimum-reporting timeout feature
     * @param {number} [minReportingTimeout=1]
     *          timeout in minutes a metric need to be included in the report without having changed
     * @memberof MetricReporter
     */
    public constructor(options: O) {
        this.options = options;
    }

    /**
     * Gets the reporter tags.
     *
     * @returns {Map<string, string>}
     * @memberof MetricReporter
     */
    public getTags(): Map<string, string> {
        return this.options.tags;
    }

    /**
     * Sets the reporter tags.
     *
     * @param {Map<string, string>} tags
     * @memberof MetricReporter
     */
    public setTags(tags: Map<string, string>): void {
        this.options.tags = tags;
    }

    /**
     * Implementations start reporting metrics when called.
     *
     * @abstract
     * @memberof MetricReporter
     */
    public abstract start(): void;

    /**
     * Implementations stop reporting metrics when called.
     *
     * @abstract
     * @memberof MetricReporter
     */
    public abstract stop(): void;

    /**
     * Adds a new {@link MetricRegistry} to be reported.
     *
     * @param {MetricRegistry} metricRegistry
     * @memberof MetricReporter
     */
    public addMetricRegistry(metricRegistry: MetricRegistry): void {
        this.metricRegistries.push(metricRegistry);
    }

    /**
     * Removes the given {@link MetricRegistry} if it was previously added.
     *
     * @param {MetricRegistry} metricRegistry
     * @memberof MetricReporter
     */
    public removeMetricRegistry(metricRegistry: MetricRegistry): void {
        const index: number = this.metricRegistries.indexOf(metricRegistry);
        if (index > -1) {
            this.metricRegistries.splice(index, 1);
        }
    }

    /**
     * Called be before each reporting run.
     *
     * @protected
     * @memberof MetricReporter
     */
    protected async beforeReport() {
    }

    /**
     * Called after each reporting run.
     *
     * @protected
     * @memberof MetricReporter
     */
    protected async afterReport() {
    }

    /**
     * Run the reporting procedures. Calls {@link #beforeReport} before each
     * {@link MetricRegistry}'s metrics are reported and {@link #afterReport}
     * afterwards.
     *
     * @protected
     * @memberof MetricReporter
     */
    protected async report() {
        if (this.metricRegistries && this.metricRegistries.length > 0) {
            await this.beforeReport();
            for (const registry of this.metricRegistries) {
                await this.reportMetricRegistry(registry);
            }
            await this.afterReport();
        }
    }

    /**
     * Reporting function for a sinlge {@link MetricRegistry}.
     * Calls {@link #createReportingContext} for each metric type.
     * Afterwarsds calls {@link #reportMetrics} for each of the
     * registry's metrics - grouped by type.
     * And finally calls {@link #handleResults} for each of the results.
     *
     * @protected
     * @param {MetricRegistry} registry
     * @memberof MetricReporter
     */
    protected async reportMetricRegistry(registry: MetricRegistry) {
        const date: Date = new Date(this.options.clock.time().milliseconds);
        const counterCtx: ReportingContext<MonotoneCounter | Counter> = this.createReportingContext(
            registry, date, "counter");
        const gaugeCtx: ReportingContext<Gauge<any>> = this.createReportingContext(registry, date, "gauge");
        const histogramCtx: ReportingContext<Histogram> = this.createReportingContext(registry, date, "histogram");
        const meterCtx: ReportingContext<Meter> = this.createReportingContext(registry, date, "meter");
        const timerCtx: ReportingContext<Timer> = this.createReportingContext(registry, date, "timer");

        counterCtx.metrics = registry.getMonotoneCounterList();
        const monotoneCounterResults = this.reportMetrics(counterCtx,
            (counter: MonotoneCounter) => this.reportCounter(counter, counterCtx),
            (counter: MonotoneCounter) => counter.getCount());

        counterCtx.metrics = registry.getCounterList();
        const counterResults = this.reportMetrics(counterCtx as ReportingContext<Counter>,
            (counter: Counter) => this.reportCounter(counter, counterCtx),
            (counter: Counter) => counter.getCount());

        gaugeCtx.metrics = registry.getGaugeList();
        const gaugeResults = this.reportMetrics(gaugeCtx,
            (gauge: Gauge<any>) => this.reportGauge(gauge, gaugeCtx),
            (gauge: Gauge<any>) => gauge.getValue());

        histogramCtx.metrics = registry.getHistogramList();
        const histogramResults = this.reportMetrics(histogramCtx,
            (histogram: Histogram) => this.reportHistogram(histogram, histogramCtx),
            (histogram: Histogram) => histogram.getCount());

        meterCtx.metrics = registry.getMeterList();
        const meterResults = this.reportMetrics(meterCtx,
            (meter: Meter) => this.reportMeter(meter, meterCtx),
            (meter: Meter) => meter.getCount());

        timerCtx.metrics = registry.getTimerList();
        const timerResults = this.reportMetrics(timerCtx,
            (timer: Timer) => this.reportTimer(timer, timerCtx),
            (timer: Timer) => timer.getCount());

        await this.handleResults(registry, date, "counter", monotoneCounterResults);
        await this.handleResults(registry, date, "counter", counterResults);
        await this.handleResults(registry, date, "gauge", gaugeResults);
        await this.handleResults(registry, date, "histogram", histogramResults);
        await this.handleResults(registry, date, "meter", meterResults);
        await this.handleResults(registry, date, "timer", timerResults);
    }

    /**
     * Creates a ReportingContext with the specified arguments.
     *
     * @protected
     * @param {MetricRegistry} registry
     * @param {Date} date
     * @param {MetricType} type
     * @returns {ReportingContext<any>}
     * @memberof MetricReporter
     */
    protected createReportingContext(registry: MetricRegistry, date: Date, type: MetricType): ReportingContext<any> {
        return {
            date,
            metrics: [],
            registry,
            type,
        };
    }

    /**
     * Filters out each metric that does not necessarily need to be reported
     * and calls the specified reporting function for the remaining.
     *
     * @protected
     * @template M type of the metric
     * @template C typed ReportingContext
     * @param {C} ctx
     * @param {(metric: M, ctx: C) => T} reportFunction
     * @param {(metric: M, ctx: C) => number} lastModifiedFunction
     * @returns {Array<ReportingResult<M, T>>}
     * @memberof MetricReporter
     */
    protected reportMetrics<M extends Metric, C extends ReportingContext<M>>(
        ctx: C,
        reportFunction: (metric: M, ctx: C) => T,
        lastModifiedFunction: (metric: M, ctx: C) => number): Array<ReportingResult<M, T>> {

        return ctx.metrics
            .filter((metric) => {
                const metricId = (metric as any).id;
                return !metricId || this.hasChanged(metricId, lastModifiedFunction(metric, ctx), ctx.date.getTime());
            })
            .map((metric) => ({
                metric,
                result: reportFunction(metric, ctx),
            }))
            .filter((result) => !!result.result);
    }

    /**
     * Handles the reporting result for a group of metric instances.
     *
     * @protected
     * @abstract
     * @param {MetricRegistry} registry
     * @param {Date} date
     * @param {MetricType} type
     * @param {Array<ReportingResult<any, T>>} results
     * @returns {Promise<void>}
     * @memberof MetricReporter
     */
    protected abstract handleResults(
        registry: MetricRegistry, date: Date, type: MetricType, results: Array<ReportingResult<any, T>>): Promise<void>;

    /**
     * Does the reporting for a counter or monotone counter.
     *
     * @protected
     * @abstract
     * @param {(MonotoneCounter | Counter)} counter
     * @param {(ReportingContext<MonotoneCounter | Counter>)} ctx
     * @returns {T}
     * @memberof MetricReporter
     */
    protected abstract reportCounter(
        counter: MonotoneCounter | Counter, ctx: ReportingContext<MonotoneCounter | Counter>): T;

    /**
     * Does the reporting for a gauge.
     *
     * @protected
     * @abstract
     * @param {Gauge<any>} gauge
     * @param {ReportingContext<Gauge<any>>} ctx
     * @returns {T}
     * @memberof MetricReporter
     */
    protected abstract reportGauge(gauge: Gauge<any>, ctx: ReportingContext<Gauge<any>>): T;

    /**
     * Does the reporting for a histogram.
     *
     * @protected
     * @abstract
     * @param {Histogram} histogram
     * @param {ReportingContext<Histogram>} ctx
     * @returns {T}
     * @memberof MetricReporter
     */
    protected abstract reportHistogram(histogram: Histogram, ctx: ReportingContext<Histogram>): T;

    /**
     * Does the reporting for a meter.
     *
     * @protected
     * @abstract
     * @param {Meter} meter
     * @param {ReportingContext<Meter>} ctx
     * @returns {T}
     * @memberof MetricReporter
     */
    protected abstract reportMeter(meter: Meter, ctx: ReportingContext<Meter>): T;

    /**
     * Does the reporting for a timer.
     *
     * @protected
     * @abstract
     * @param {Timer} timer
     * @param {ReportingContext<Timer>} ctx
     * @returns {T}
     * @memberof MetricReporter
     */
    protected abstract reportTimer(timer: Timer, ctx: ReportingContext<Timer>): T;

    /**
     * Determines if a metric instance has changed it's value since the last check.
     * This is always true if the minimal-reporting timeout was reached.
     *
     * @private
     * @param {number} metricId
     * @param {number} lastValue
     * @param {Date} date
     * @returns {boolean}
     * @memberof MetricReporter
     */
    protected hasChanged(metricId: number, lastValue: number, date: number): boolean {
        let changed = true;
        let metricEntry = {
            lastReport: 0,
            lastValue,
        };
        if (this.metricStates.has(metricId)) {
            metricEntry = this.metricStates.get(metricId);
            changed = metricEntry.lastValue !== lastValue;
            if (!changed) {
                changed = metricEntry.lastReport + this.options.minReportingTimeout < date;
            }
        }
        if (changed) {
            metricEntry.lastReport = date;
        }
        this.metricStates.set(metricId, metricEntry);
        return changed;
    }

    /**
     * Combines the tags of this reporter instance, the specified {@link MetricRegistry}
     * and the specified taggable metric (in this order).
     *
     * @protected
     * @param {MetricRegistry} registry
     * @param {Taggable} taggable
     * @returns {Tags}
     * @memberof MetricReporter
     */
    protected buildTags(registry: MetricRegistry, taggable: Taggable): Tags {
        const tags: Tags = {};
        if (this.options.tags) {
            this.options.tags.forEach((tag, key) => tags[key] = tag);
        }
        if (registry.getTags()) {
            registry.getTags().forEach((tag, key) => tags[key] = tag);
        }
        if (taggable.getTags()) {
            taggable.getTags().forEach((tag, key) => tags[key] = tag);
        }
        return tags;
    }

    /**
     * Checks the number and gives it back or zero (0) if it's not a number.
     *
     * @protected
     * @param {number} value
     * @returns {number}
     * @memberof MetricReporter
     */
    protected getNumber(value: number): number {
        if (isNaN(value)) {
            return 0;
        }
        return value;
    }

}
