import "source-map-support/register";

/**
 * Graphite / carbon client module.
 */
const graphite = require("graphite");

import {
    Clock,
    Counter,
    Event,
    Gauge,
    Histogram,
    Logger,
    Meter,
    MetricRegistry,
    MetricSetReportContext,
    MetricType,
    MILLISECOND,
    MonotoneCounter,
    OverallReportContext,
    ReportingResult,
    ScheduledMetricReporter,
    ScheduledMetricReporterOptions,
    Scheduler,
    StdClock,
    Tags,
    Timer,
    TimeUnit,
} from "inspector-metrics";

export interface CarbonMetricReporterOptions extends ScheduledMetricReporterOptions {
    /**
     * The graphite / carbon host.
     *
     * @type {string}
     * @memberof CarbonMetricReporterOptions
     */
    readonly host: string;
    /**
     * Minimal logger interface to report failures.
     *
     * @type {Logger}
     * @memberof CarbonMetricReporterOptions
     */
    log: Logger;
}

/**
 * Helper interface for representing the result of a metric report.
 *
 * @export
 * @interface CarbonData
 */
export interface CarbonData {
    /**
     * Document that is getting sent to the carbon / graphite server.
     *
     * @type {*}
     * @memberof CarbonData
     */
    measurement: any;
    /**
     * Combined tags for the metric.
     *
     * @type {Tags}
     * @memberof CarbonData
     */
    tags: Tags;
}

/**
 * Metric reporter for graphite / carbon.
 *
 * @export
 * @class CarbonMetricReporter
 * @extends {MetricReporter}
 */
export class CarbonMetricReporter extends ScheduledMetricReporter<CarbonMetricReporterOptions, CarbonData> {

    /**
     * Metadata for the logger.
     *
     * @private
     * @type {*}
     * @memberof CarbonMetricReporter
     */
    private logMetadata: any;
    /**
     * Graphite / carbon client instance.
     *
     * @private
     * @type {*}
     * @memberof CarbonMetricReporter
     */
    private client: any;

    /**
     * Creates an instance of CarbonMetricReporter.
     *
     * @memberof CarbonMetricReporter
     */
    public constructor({
        host,
        log = console,
        reportInterval = 1000,
        unit = MILLISECOND,
        clock = new StdClock(),
        scheduler = setInterval,
        minReportingTimeout = 1,
        tags = new Map(),
    }: {
        /**
         * The graphite / carbon host.
         * @type {string}
         */
        host: string,
        /**
         * The logger instance used to report metrics.
         * @type {Logger}
         */
        log?: Logger,
        /**
         * Reporting interval in the time-unit of {@link #unit}.
         * @type {number}
         */
        reportInterval?: number;
        /**
         * The time-unit of the reporting interval.
         * @type {TimeUnit}
         */
        unit?: TimeUnit;
        /**
         * The clock instance used determine the current time.
         * @type {Clock}
         */
        clock?: Clock;
        /**
         * The scheduler function used to trigger reporting.
         * @type {Scheduler}
         */
        scheduler?: Scheduler;
        /**
         * The timeout in which a metrics gets reported wether it's value has changed or not.
         * @type {number}
         */
        minReportingTimeout?: number;
        /**
         * Common tags for this reporter instance.
         * @type {Map<string, string>}
         */
        tags?: Map<string, string>;
    }) {
        super({
            clock,
            host,
            log,
            minReportingTimeout,
            reportInterval,
            scheduler,
            tags,
            unit,
        });

        this.logMetadata = {
            reportInterval,
            tags,
            unit,
        };
    }

    /**
     * Gets the logger instance.
     *
     * @returns {Logger}
     * @memberof CarbonMetricReporter
     */
    public getLog(): Logger {
        return this.options.log;
    }

    /**
     * Sets the logger instance.
     *
     * @param {Logger} log
     * @memberof CarbonMetricReporter
     */
    public setLog(log: Logger): void {
        this.options.log = log;
    }

    /**
     * Reports an {@link Event}.
     *
     * @param {Event} event
     * @returns {Promise<TEvent>}
     * @memberof CarbonMetricReporter
     */
    public async reportEvent<TEventData, TEvent extends Event<TEventData>>(event: TEvent): Promise<TEvent> {
        const result = this.reportGauge(event, {
            date: event.getTime(),
            metrics: [],
            overallCtx: null,
            registry: null,
            type: "gauge",
        });

        await this.handleResults(
            this.createOverallReportContext(),
            null,
            event.getTime(),
            "gauge",
            [{
                metric: event,
                result,
            }],
        );

        return event;
    }

    /**
     * Does nothing
     *
     * @returns {Promise<void>}
     * @memberof CarbonMetricReporter
     */
    public async flushEvents(): Promise<void> {
    }

    /**
     * Uses the scheduler function to trigger periodical reporting.
     *
     * @memberof CarbonMetricReporter
     */
    public start(): this {
        this.client = graphite.createClient(this.options.host);
        return super.start();
    }

    /**
     * Stops the timer reference returned by the scheduler function.
     *
     * @memberof CarbonMetricReporter
     */
    public stop(): this {
        super.stop();
        if (this.client) {
            this.client.end();
        }
        return this;
    }

    /**
     * Uses the client instance to report the given metric results.
     *
     * @protected
     * @param {MetricRegistry} registry
     * @param {Date} timestamp
     * @param {MetricType} type
     * @param {ReportingResult<any, CarbonData>[]} results
     * @returns {Promise<any>}
     * @memberof CarbonMetricReporter
     */
    protected handleResults(
        ctx: OverallReportContext,
        registry: MetricRegistry,
        timestamp: Date,
        type: MetricType,
        results: Array<ReportingResult<any, CarbonData>>): Promise<any> {
        return Promise.all(results
            .map((result) => result.result)
            .map((carbonData) => new Promise((resolve, reject) => {
                this.client.writeTagged(carbonData.measurement, carbonData.tags, timestamp, (err: any) => {
                    if (err != null) {
                        if (this.options.log) {
                            this.options.log.error(err, this.logMetadata);
                        }
                        reject(err);
                    }
                    resolve();
                });
            })));
    }

    /**
     * Builds the {@link CarbonData} for the specified {@link Counter} or {@link MonotoneCounter}.
     *
     * @protected
     * @param {(MonotoneCounter | Counter)} counter
     * @param {(MetricSetReportContext<MonotoneCounter | Counter>)} ctx
     * @returns {CarbonData}
     * @memberof CarbonMetricReporter
     */
    protected reportCounter(
        counter: MonotoneCounter | Counter,
        ctx: MetricSetReportContext<MonotoneCounter | Counter>): CarbonData {
        const value = counter.getCount();
        if (!value || isNaN(value)) {
            return null;
        }
        const measurement: any = {
            group: counter.getGroup(),
            name: counter.getName(),
        };
        measurement[`count`] = counter.getCount() || 0;

        return {
            measurement,
            tags: this.buildTags(ctx.registry, counter),
        };
    }

    /**
     * Builds the {@link CarbonData} for the specified {@link Gauge}.
     *
     * @protected
     * @param {Gauge<any>} gauge
     * @param {MetricSetReportContext<Gauge<any>>} ctx
     * @returns {CarbonData}
     * @memberof CarbonMetricReporter
     */
    protected reportGauge(gauge: Gauge<any>, ctx: MetricSetReportContext<Gauge<any>>): CarbonData {
        const value = gauge.getValue();
        if (!value || isNaN(value)) {
            return null;
        }
        const measurement: any = {
            group: gauge.getGroup(),
            name: gauge.getName(),
        };
        measurement[`value`] = gauge.getValue() || 0;

        return {
            measurement,
            tags: this.buildTags(ctx.registry, gauge),
        };
    }

    /**
     * Builds the {@link CarbonData} for the specified {@link Histogram}.
     *
     * @protected
     * @param {Histogram} histogram
     * @param {MetricSetReportContext<Histogram>} ctx
     * @returns {CarbonData}
     * @memberof CarbonMetricReporter
     */
    protected reportHistogram(histogram: Histogram, ctx: MetricSetReportContext<Histogram>): CarbonData {
        const value = histogram.getCount();
        if (!value || isNaN(value)) {
            return null;
        }
        const snapshot = histogram.getSnapshot();
        const measurement: any = {
            group: histogram.getGroup(),
            name: histogram.getName(),
        };
        measurement[`count`] = histogram.getCount() || 0;
        measurement[`max`] = this.getNumber(snapshot.getMax());
        measurement[`mean`] = this.getNumber(snapshot.getMean());
        measurement[`min`] = this.getNumber(snapshot.getMin());
        measurement[`p50`] = this.getNumber(snapshot.getMedian());
        measurement[`p75`] = this.getNumber(snapshot.get75thPercentile());
        measurement[`p95`] = this.getNumber(snapshot.get95thPercentile());
        measurement[`p98`] = this.getNumber(snapshot.get98thPercentile());
        measurement[`p99`] = this.getNumber(snapshot.get99thPercentile());
        measurement[`p999`] = this.getNumber(snapshot.get999thPercentile());
        measurement[`stddev`] = this.getNumber(snapshot.getStdDev());

        return {
            measurement,
            tags: this.buildTags(ctx.registry, histogram),
        };
    }

    /**
     * Builds the {@link CarbonData} for the specified {@link Meter}.
     *
     * @protected
     * @param {Meter} meter
     * @param {MetricSetReportContext<Meter>} ctx
     * @returns {CarbonData}
     * @memberof CarbonMetricReporter
     */
    protected reportMeter(meter: Meter, ctx: MetricSetReportContext<Meter>): CarbonData {
        const value = meter.getCount();
        if (!value || isNaN(value)) {
            return null;
        }
        const measurement: any = {
            group: meter.getGroup(),
            name: meter.getName(),
        };
        measurement[`count`] = meter.getCount() || 0;
        measurement[`m15_rate`] = this.getNumber(meter.get15MinuteRate());
        measurement[`m1_rate`] = this.getNumber(meter.get1MinuteRate());
        measurement[`m5_rate`] = this.getNumber(meter.get5MinuteRate());
        measurement[`mean_rate`] = this.getNumber(meter.getMeanRate());

        return {
            measurement,
            tags: this.buildTags(ctx.registry, meter),
        };
    }

    /**
     * Builds the {@link CarbonData} for the specified {@link Timer}.
     *
     * @protected
     * @param {Timer} timer
     * @param {MetricSetReportContext<Timer>} ctx
     * @returns {CarbonData}
     * @memberof CarbonMetricReporter
     */
    protected reportTimer(timer: Timer, ctx: MetricSetReportContext<Timer>): CarbonData {
        const value = timer.getCount();
        if (!value || isNaN(value)) {
            return null;
        }
        const snapshot = timer.getSnapshot();
        const measurement: any = {
            group: timer.getGroup(),
            name: timer.getName(),
        };
        measurement[`count`] = timer.getCount() || 0;
        measurement[`m15_rate`] = this.getNumber(timer.get15MinuteRate());
        measurement[`m1_rate`] = this.getNumber(timer.get1MinuteRate());
        measurement[`m5_rate`] = this.getNumber(timer.get5MinuteRate());
        measurement[`max`] = this.getNumber(snapshot.getMax());
        measurement[`mean`] = this.getNumber(snapshot.getMean());
        measurement[`mean_rate`] = this.getNumber(timer.getMeanRate());
        measurement[`min`] = this.getNumber(snapshot.getMin());
        measurement[`p50`] = this.getNumber(snapshot.getMedian());
        measurement[`p75`] = this.getNumber(snapshot.get75thPercentile());
        measurement[`p95`] = this.getNumber(snapshot.get95thPercentile());
        measurement[`p98`] = this.getNumber(snapshot.get98thPercentile());
        measurement[`p99`] = this.getNumber(snapshot.get99thPercentile());
        measurement[`p999`] = this.getNumber(snapshot.get999thPercentile());
        measurement[`stddev`] = this.getNumber(snapshot.getStdDev());

        return {
            measurement,
            tags: this.buildTags(ctx.registry, timer),
        };
    }

}
