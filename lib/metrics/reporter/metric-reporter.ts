import "source-map-support/register";

import { Clock } from "../clock";
import { Counter, MonotoneCounter } from "../counter";
import { Event } from "../event";
import { Gauge } from "../gauge";
import { Histogram } from "../histogram";
import { Meter } from "../meter";
import { Metric } from "../metric";
import { MetricRegistry } from "../metric-registry";
import { Taggable } from "../taggable";
import { MILLISECOND, MINUTE } from "../time-unit";
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
 * Helper interface for a reporting run.
 */
export interface OverallReportContext {
    [key: string]: any;
}

/**
 * Helper interface for reporting runs.
 */
export interface MetricSetReportContext<M> {
    /**
     * The OverallReportContext this context is running in.
     *
     * @type {OverallReportContext}
     * @memberof ReportingContext
     */
    overallCtx: OverallReportContext;
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
 * Interface for metric-reporter.
 *
 * @export
 * @interface IMetricReporter
 */
export interface IMetricReporter {
    /**
     * Gets the reporter tags.
     *
     * @returns {Map<string, string>}
     * @memberof IMetricReporter
     */
    getTags(): Map<string, string>;

    /**
     * Sets the reporter tags.
     *
     * @param {Map<string, string>} tags
     * @returns {this}
     * @memberof IMetricReporter
     */
    setTags(tags: Map<string, string>): this;

    /**
     * Implementations start reporting metrics when called.
     *
     * @abstract
     * @returns {Promise<this>}
     * @memberof IMetricReporter
     */
    start(): Promise<this>;

    /**
     * Implementations stop reporting metrics when called.
     *
     * @abstract
     * @returns {Promise<this>}
     * @memberof IMetricReporter
     */
    stop(): Promise<this>;

    /**
     * Adds a new {@link MetricRegistry} to be reported.
     *
     * @param {MetricRegistry} metricRegistry
     * @returns {this}
     * @memberof IMetricReporter
     */
    addMetricRegistry(metricRegistry: MetricRegistry): this;

    /**
     * Removes the given {@link MetricRegistry} if it was previously added.
     *
     * @param {MetricRegistry} metricRegistry
     * @returns {this}
     * @memberof IMetricReporter
     */
    removeMetricRegistry(metricRegistry: MetricRegistry): this;

    /**
     * Reports an {@link Event}.
     *
     * Implementations can choose how to process ad-hoc events, wether it's
     * queuing the events to the next call to report or sending events
     * immediately.
     *
     * Also the usual reporting process of calling {@link #beforeReport}, do the reporting
     * and call {@link #afterReport} may not be applied for ad-hoc events.
     *
     * This implementation does nothing and always resolved the specified evnet.
     *
     * @param {MetricRegistry} event
     * @returns {this}
     * @memberof IMetricReporter
     */
    reportEvent<TEventData, TEvent extends Event<TEventData>>(event: TEvent): Promise<TEvent>;

    /**
     * Sends events remaining in the queue (if a queue is used in the implementation).
     *
     * @returns {Promise<void>}
     * @memberof IMetricReporter
     */
    flushEvents(): Promise<void>;
}

/**
 * Base-class for metric-reporter implementations.
 *
 * @export
 * @abstract
 * @class MetricReporter
 */
export abstract class MetricReporter<O extends MetricReporterOptions, T> implements IMetricReporter {

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
     * @returns {this}
     * @memberof MetricReporter
     */
    public setTags(tags: Map<string, string>): this {
        this.options.tags = tags;
        return this;
    }

    /**
     * Implementations start reporting metrics when called.
     *
     * @abstract
     * @returns {Promise<this>}
     * @memberof MetricReporter
     */
    public abstract start(): Promise<this>;

    /**
     * Implementations stop reporting metrics when called.
     *
     * @abstract
     * @returns {Promise<this>}
     * @memberof MetricReporter
     */
    public abstract stop(): Promise<this>;

    /**
     * Adds a new {@link MetricRegistry} to be reported.
     *
     * @param {MetricRegistry} metricRegistry
     * @returns {this}
     * @memberof MetricReporter
     */
    public addMetricRegistry(metricRegistry: MetricRegistry): this {
        this.metricRegistries.push(metricRegistry);
        return this;
    }

    /**
     * Removes the given {@link MetricRegistry} if it was previously added.
     *
     * @param {MetricRegistry} metricRegistry
     * @returns {this}
     * @memberof MetricReporter
     */
    public removeMetricRegistry(metricRegistry: MetricRegistry): this {
        const index: number = this.metricRegistries.indexOf(metricRegistry);
        if (index > -1) {
            this.metricRegistries.splice(index, 1);
        }
        return this;
    }

    /**
     * Reports an {@link Event}.
     *
     * Implementations can choose how to process ad-hoc events, wether it's
     * queuing the events to the next call to report or sending events
     * immediately.
     *
     * Also the usual reporting process of calling {@link #beforeReport}, do the reporting
     * and call {@link #afterReport} may not be applied for ad-hoc events.
     *
     * This implementation does nothing and always resolved the specified event.
     *
     * @param {Event} event
     * @returns {Promise<TEvent>}
     * @memberof MetricReporter
     */
    public async reportEvent<TEventData, TEvent extends Event<TEventData>>(event: TEvent): Promise<TEvent> {
        return event;
    }

    /**
     * Sends events remaining in the queue (if a queue is used in the implementation).
     *
     * @returns {Promise<void>}
     * @memberof MetricReporter
     */
    public async flushEvents(): Promise<void> {
    }

    /**
     * Called be before each reporting run.
     *
     * @protected
     * @memberof MetricReporter
     */
    protected async beforeReport(ctx: OverallReportContext) {
    }

    /**
     * Called after each reporting run.
     *
     * @protected
     * @memberof MetricReporter
     */
    protected async afterReport(ctx: OverallReportContext) {
    }

    /**
     * Run the reporting procedures. Calls {@link #beforeReport} before each
     * {@link MetricRegistry}'s metrics are reported and {@link #afterReport}
     * afterwards.
     *
     * @protected
     * @memberof MetricReporter
     */
    protected async report(): Promise<OverallReportContext> {
        if (this.metricRegistries && this.metricRegistries.length > 0) {
            const ctx = this.createOverallReportContext();
            await this.beforeReport(ctx);
            for (const registry of this.metricRegistries) {
                await this.reportMetricRegistry(ctx, registry);
            }
            await this.afterReport(ctx);
            return ctx;
        }
        return {};
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
    protected async reportMetricRegistry(ctx: OverallReportContext, registry: MetricRegistry) {
        const date: Date = new Date(this.options.clock.time().milliseconds);
        const counterCtx: MetricSetReportContext<MonotoneCounter | Counter> = this
            .createMetricSetReportContext(ctx, registry, date, "counter");
        const gaugeCtx: MetricSetReportContext<Gauge<any>> = this
            .createMetricSetReportContext(ctx, registry, date, "gauge");
        const histogramCtx: MetricSetReportContext<Histogram> = this
            .createMetricSetReportContext(ctx, registry, date, "histogram");
        const meterCtx: MetricSetReportContext<Meter> = this
            .createMetricSetReportContext(ctx, registry, date, "meter");
        const timerCtx: MetricSetReportContext<Timer> = this
            .createMetricSetReportContext(ctx, registry, date, "timer");

        counterCtx.metrics = registry.getMonotoneCounterList();
        const monotoneCounterResults = this.reportMetrics(ctx, counterCtx,
            (counter: MonotoneCounter) => this.reportCounter(counter, counterCtx),
            (counter: MonotoneCounter) => counter.getCount());

        counterCtx.metrics = registry.getCounterList();
        const counterResults = this.reportMetrics(ctx, counterCtx as MetricSetReportContext<Counter>,
            (counter: Counter) => this.reportCounter(counter, counterCtx),
            (counter: Counter) => counter.getCount());

        gaugeCtx.metrics = registry.getGaugeList();
        const gaugeResults = this.reportMetrics(ctx, gaugeCtx,
            (gauge: Gauge<any>) => this.reportGauge(gauge, gaugeCtx),
            (gauge: Gauge<any>) => gauge.getValue());

        histogramCtx.metrics = registry.getHistogramList();
        const histogramResults = this.reportMetrics(ctx, histogramCtx,
            (histogram: Histogram) => this.reportHistogram(histogram, histogramCtx),
            (histogram: Histogram) => histogram.getCount());

        meterCtx.metrics = registry.getMeterList();
        const meterResults = this.reportMetrics(ctx, meterCtx,
            (meter: Meter) => this.reportMeter(meter, meterCtx),
            (meter: Meter) => meter.getCount());

        timerCtx.metrics = registry.getTimerList();
        const timerResults = this.reportMetrics(ctx, timerCtx,
            (timer: Timer) => this.reportTimer(timer, timerCtx),
            (timer: Timer) => timer.getCount());

        await this.handleResults(ctx, registry, date, "counter", monotoneCounterResults);
        await this.handleResults(ctx, registry, date, "counter", counterResults);
        await this.handleResults(ctx, registry, date, "gauge", gaugeResults);
        await this.handleResults(ctx, registry, date, "histogram", histogramResults);
        await this.handleResults(ctx, registry, date, "meter", meterResults);
        await this.handleResults(ctx, registry, date, "timer", timerResults);
    }

    /**
     * Creates an OverallReportContext.
     *
     * @protected
     * @returns {OverallReportContext}
     * @memberof MetricReporter
     */
    protected createOverallReportContext(): OverallReportContext {
        return {
        };
    }

    /**
     * Creates a MetricSetReportContext with the specified arguments.
     *
     * @protected
     * @param {OverallReportContext} overallCtx
     * @param {MetricRegistry} registry
     * @param {Date} date
     * @param {MetricType} type
     * @returns {MetricSetReportContext<any>}
     * @memberof MetricReporter
     */
    protected createMetricSetReportContext(
        overallCtx: OverallReportContext,
        registry: MetricRegistry,
        date: Date,
        type: MetricType): MetricSetReportContext<any> {
        return {
            date,
            metrics: [],
            overallCtx,
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
    protected reportMetrics<M extends Metric, C extends MetricSetReportContext<M>>(
        overallCtx: OverallReportContext,
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
     * @param {OverallReportContext} ctx
     * @param {MetricRegistry} registry
     * @param {Date} date
     * @param {MetricType} type
     * @param {Array<ReportingResult<any, T>>} results
     * @returns {Promise<void>}
     * @memberof MetricReporter
     */
    protected abstract handleResults(
        ctx: OverallReportContext,
        registry: MetricRegistry,
        date: Date,
        type: MetricType,
        results: Array<ReportingResult<any, T>>): Promise<void>;

    /**
     * Does the reporting for a counter or monotone counter.
     *
     * @protected
     * @abstract
     * @param {(MonotoneCounter | Counter)} counter
     * @param {(MetricSetReportContext<MonotoneCounter | Counter>)} ctx
     * @returns {T}
     * @memberof MetricReporter
     */
    protected abstract reportCounter(
        counter: MonotoneCounter | Counter, ctx: MetricSetReportContext<MonotoneCounter | Counter>): T;

    /**
     * Does the reporting for a gauge.
     *
     * @protected
     * @abstract
     * @param {Gauge<any>} gauge
     * @param {MetricSetReportContext<Gauge<any>>} ctx
     * @returns {T}
     * @memberof MetricReporter
     */
    protected abstract reportGauge(gauge: Gauge<any>, ctx: MetricSetReportContext<Gauge<any>>): T;

    /**
     * Does the reporting for a histogram.
     *
     * @protected
     * @abstract
     * @param {Histogram} histogram
     * @param {MetricSetReportContext<Histogram>} ctx
     * @returns {T}
     * @memberof MetricReporter
     */
    protected abstract reportHistogram(histogram: Histogram, ctx: MetricSetReportContext<Histogram>): T;

    /**
     * Does the reporting for a meter.
     *
     * @protected
     * @abstract
     * @param {Meter} meter
     * @param {MetricSetReportContext<Meter>} ctx
     * @returns {T}
     * @memberof MetricReporter
     */
    protected abstract reportMeter(meter: Meter, ctx: MetricSetReportContext<Meter>): T;

    /**
     * Does the reporting for a timer.
     *
     * @protected
     * @abstract
     * @param {Timer} timer
     * @param {MetricSetReportContext<Timer>} ctx
     * @returns {T}
     * @memberof MetricReporter
     */
    protected abstract reportTimer(timer: Timer, ctx: MetricSetReportContext<Timer>): T;

    /**
     * Determines if a metric instance has changed it's value since the last check.
     * This is always true if the minimal-reporting timeout was reached.
     *
     * @private
     * @param {number} metricId
     * @param {number} lastValue
     * @param {number} date
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
                const minReportingTimeout = MINUTE.convertTo(this.options.minReportingTimeout, MILLISECOND);
                changed = metricEntry.lastReport + minReportingTimeout < date;
            }
        }
        if (changed) {
            metricEntry.lastReport = date;
            metricEntry.lastValue = lastValue;
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
        if (registry && registry.getTags()) {
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
