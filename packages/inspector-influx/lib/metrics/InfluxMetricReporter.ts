import "source-map-support/register";

import * as async from "async";
import { IPoint } from "influx";
import {
    Clock,
    Counter,
    Gauge,
    Histogram,
    Logger,
    Meter,
    Metric,
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
    Timer,
    TimeUnit,
} from "inspector-metrics";

/**
 * Sender interface for influxdb client abstraction.
 *
 * @export
 * @interface Sender
 */
export interface Sender {

    /**
     * Indicates if the sender is ready to send data.
     *
     * @returns {Promise<boolean>}
     * @memberof Sender
     */
    isReady(): Promise<boolean>;

    /**
     * Triggers the initialization process.
     *
     * @returns {Promise<any>}
     * @memberof Sender
     */
    init(): Promise<any>;

    /**
     * Sends the given data points to influxdb.
     *
     * @param {IPoint[]} points
     * @returns {Promise<any>}
     * @memberof Sender
     */
    send(points: IPoint[]): Promise<any>;

}

/**
 * Options for {@link InfluxMetricReporter}.
 *
 * @export
 * @interface InfluxMetricReporterOptions
 * @extends {ScheduledMetricReporterOptions}
 */
export interface InfluxMetricReporterOptions extends ScheduledMetricReporterOptions {
    /**
     * A logger instance used to report errors.
     *
     * @type {Logger}
     * @memberof InfluxMetricReporterOptions
     */
    log: Logger;
    /**
     * A sender implementation used to send metrics to influx DB server.
     *
     * @type {Sender}
     * @memberof InfluxMetricReporterOptions
     */
    readonly sender: Sender;
}

/**
 * InfluxDB reporter implementation.
 *
 * @export
 * @class InfluxMetricReporter
 * @extends {ScheduledMetricReporter}
 */
export class InfluxMetricReporter extends ScheduledMetricReporter<InfluxMetricReporterOptions, IPoint> {

    /**
     * Metadata for the logger.
     *
     * @private
     * @type {*}
     * @memberof InfluxMetricReporter
     */
    private logMetadata: any;
    /**
     * async queue used to queue data point sending.
     *
     * @private
     * @type {async.AsyncQueue<any>}
     * @memberof InfluxMetricReporter
     */
    private queue: async.AsyncQueue<any>;

    /**
     * Creates an instance of InfluxMetricReporter.
     *
     * @memberof InfluxMetricReporter
     */
    public constructor({
        sender,
        log = console,
        reportInterval = 1000,
        unit = MILLISECOND,
        clock = new StdClock(),
        scheduler = setInterval,
        minReportingTimeout = 1,
        tags = new Map(),
    }: {
        /**
         * A sender implementation used to send metrics to influx DB server.
         * @type {Sender}
         */
        sender: Sender,
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
            log,
            minReportingTimeout,
            reportInterval,
            scheduler,
            sender,
            tags,
            unit,
        });

        this.logMetadata = {
            reportInterval,
            tags,
            unit,
        };

        this.queue = async.queue((task: (clb: () => void) => void, callback: () => void) => {
            task(callback);
        }, 1);

        let unlock: () => void = null;
        this.queue.push((callback: () => void) => {
            unlock = callback;
        });

        this.options.sender.init()
            .then(() => unlock());
    }

    /**
     * Gets the logger instance.
     *
     * @returns {Logger}
     * @memberof InfluxMetricReporter
     */
    public getLog(): Logger {
        return this.options.log;
    }

    /**
     * Sets the logger instance.
     *
     * @param {Logger} log
     * @memberof InfluxMetricReporter
     */
    public setLog(log: Logger): void {
        this.options.log = log;
    }

    /**
     * Reports the data points for each registered {@link MetricRegistry}.
     *
     * @protected
     * @memberof InfluxMetricReporter
     */
    protected async report(): Promise<OverallReportContext> {
        const senderReady = await this.options.sender.isReady();
        if (senderReady) {
            return await super.report();
        }
        return {};
    }

    /**
     * Uses the sender to report the given data points.
     *
     * @protected
     * @param {MetricRegistry} registry
     * @param {Date} date
     * @param {MetricType} type
     * @param {Array<ReportingResult<any, IPoint>>} results
     * @returns {Promise<any>}
     * @memberof InfluxMetricReporter
     */
    protected handleResults(
        ctx: OverallReportContext,
        registry: MetricRegistry,
        date: Date,
        type: MetricType,
        results: Array<ReportingResult<any, IPoint>>): Promise<any> {
        return new Promise((resolve, reject) => {
            this.queue.push((callback: () => void) => {
                const points = results.map((result) => result.result);
                this.options.sender.send(points)
                    .then(() => {
                        if (this.options.log) {
                            this.options.log.debug(`wrote ${type} metrics`, this.logMetadata);
                        }
                    })
                    .catch((reason) => {
                        if (this.options.log) {
                            this.options.log
                                .error(`error writing ${type} metrics - reason: ${reason}`, reason, this.logMetadata);
                        }
                    })
                    .then(() => callback())
                    .then(() => resolve());
            });
        });
    }

    /**
     * Builds an IPoint instance for the given {@link Counter} or  {@link MonotoneCounter}.
     *
     * @protected
     * @param {(MonotoneCounter | Counter)} counter
     * @param {(MetricSetReportContext<MonotoneCounter | Counter>)} ctx
     * @returns {IPoint}
     * @memberof InfluxMetricReporter
     */
    protected reportCounter(
        counter: MonotoneCounter | Counter,
        ctx: MetricSetReportContext<MonotoneCounter | Counter>): IPoint {
        const value = counter.getCount();
        if (!value || isNaN(value)) {
            return null;
        }
        const fields: any = {};
        const fieldNamePrefix = this.getFieldNamePrefix(counter);
        const measurement = this.getMeasurementName(counter);

        fields[`${fieldNamePrefix}count`] = counter.getCount() || 0;

        return {
            fields,
            measurement,
            tags: this.buildTags(ctx.registry, counter),
            timestamp: ctx.date,
        };
    }

    /**
     * Builds an IPoint instance for the given {@link Gauge}.
     *
     * @protected
     * @param {Gauge<any>} gauge
     * @param {MetricSetReportContext<Gauge<any>>} ctx
     * @returns {IPoint}
     * @memberof InfluxMetricReporter
     */
    protected reportGauge(gauge: Gauge<any>, ctx: MetricSetReportContext<Gauge<any>>): IPoint {
        const value = gauge.getValue();
        if (!value || isNaN(value)) {
            return null;
        }
        const fields: any = {};
        const fieldNamePrefix = this.getFieldNamePrefix(gauge);
        const measurement = this.getMeasurementName(gauge);

        fields[`${fieldNamePrefix}value`] = gauge.getValue() || 0;

        return {
            fields,
            measurement,
            tags: this.buildTags(ctx.registry, gauge),
            timestamp: ctx.date,
        };
    }

    /**
     * Builds an IPoint instance for the given {@link Histogram}.
     *
     * @protected
     * @param {Histogram} histogram
     * @param {MetricSetReportContext<Histogram>} ctx
     * @returns {IPoint}
     * @memberof InfluxMetricReporter
     */
    protected reportHistogram(histogram: Histogram, ctx: MetricSetReportContext<Histogram>): IPoint {
        const value = histogram.getCount();
        if (!value || isNaN(value)) {
            return null;
        }
        const snapshot = histogram.getSnapshot();
        const fields: any = {};
        const fieldNamePrefix = this.getFieldNamePrefix(histogram);
        const measurement = this.getMeasurementName(histogram);

        fields[`${fieldNamePrefix}count`] = histogram.getCount() || 0;
        fields[`${fieldNamePrefix}max`] = this.getNumber(snapshot.getMax());
        fields[`${fieldNamePrefix}mean`] = this.getNumber(snapshot.getMean());
        fields[`${fieldNamePrefix}min`] = this.getNumber(snapshot.getMin());
        fields[`${fieldNamePrefix}p50`] = this.getNumber(snapshot.getMedian());
        fields[`${fieldNamePrefix}p75`] = this.getNumber(snapshot.get75thPercentile());
        fields[`${fieldNamePrefix}p95`] = this.getNumber(snapshot.get95thPercentile());
        fields[`${fieldNamePrefix}p98`] = this.getNumber(snapshot.get98thPercentile());
        fields[`${fieldNamePrefix}p99`] = this.getNumber(snapshot.get99thPercentile());
        fields[`${fieldNamePrefix}p999`] = this.getNumber(snapshot.get999thPercentile());
        fields[`${fieldNamePrefix}stddev`] = this.getNumber(snapshot.getStdDev());

        return {
            fields,
            measurement,
            tags: this.buildTags(ctx.registry, histogram),
            timestamp: ctx.date,
        };
    }

    /**
     * Builds an IPoint instance for the given {@link Meter}.
     *
     * @protected
     * @param {Meter} meter
     * @param {MetricSetReportContext<Meter>} ctx
     * @returns {IPoint}
     * @memberof InfluxMetricReporter
     */
    protected reportMeter(meter: Meter, ctx: MetricSetReportContext<Meter>): IPoint {
        const value = meter.getCount();
        if (!value || isNaN(value)) {
            return null;
        }
        const fields: any = {};
        const fieldNamePrefix = this.getFieldNamePrefix(meter);
        const measurement = this.getMeasurementName(meter);

        fields[`${fieldNamePrefix}count`] = meter.getCount() || 0;
        fields[`${fieldNamePrefix}m15_rate`] = this.getNumber(meter.get15MinuteRate());
        fields[`${fieldNamePrefix}m1_rate`] = this.getNumber(meter.get1MinuteRate());
        fields[`${fieldNamePrefix}m5_rate`] = this.getNumber(meter.get5MinuteRate());
        fields[`${fieldNamePrefix}mean_rate`] = this.getNumber(meter.getMeanRate());

        return {
            fields,
            measurement,
            tags: this.buildTags(ctx.registry, meter),
            timestamp: ctx.date,
        };
    }

    /**
     * Builds an IPoint instance for the given {@link Timer}.
     *
     * @protected
     * @param {Timer} timer
     * @param {MetricSetReportContext<Timer>} ctx
     * @returns {IPoint}
     * @memberof InfluxMetricReporter
     */
    protected reportTimer(timer: Timer, ctx: MetricSetReportContext<Timer>): IPoint {
        const value = timer.getCount();
        if (!value || isNaN(value)) {
            return null;
        }
        const snapshot = timer.getSnapshot();
        const fields: any = {};
        const fieldNamePrefix = this.getFieldNamePrefix(timer);
        const measurement = this.getMeasurementName(timer);

        fields[`${fieldNamePrefix}count`] = timer.getCount() || 0;
        fields[`${fieldNamePrefix}m15_rate`] = this.getNumber(timer.get15MinuteRate());
        fields[`${fieldNamePrefix}m1_rate`] = this.getNumber(timer.get1MinuteRate());
        fields[`${fieldNamePrefix}m5_rate`] = this.getNumber(timer.get5MinuteRate());
        fields[`${fieldNamePrefix}max`] = this.getNumber(snapshot.getMax());
        fields[`${fieldNamePrefix}mean`] = this.getNumber(snapshot.getMean());
        fields[`${fieldNamePrefix}mean_rate`] = this.getNumber(timer.getMeanRate());
        fields[`${fieldNamePrefix}min`] = this.getNumber(snapshot.getMin());
        fields[`${fieldNamePrefix}p50`] = this.getNumber(snapshot.getMedian());
        fields[`${fieldNamePrefix}p75`] = this.getNumber(snapshot.get75thPercentile());
        fields[`${fieldNamePrefix}p95`] = this.getNumber(snapshot.get95thPercentile());
        fields[`${fieldNamePrefix}p98`] = this.getNumber(snapshot.get98thPercentile());
        fields[`${fieldNamePrefix}p99`] = this.getNumber(snapshot.get99thPercentile());
        fields[`${fieldNamePrefix}p999`] = this.getNumber(snapshot.get999thPercentile());
        fields[`${fieldNamePrefix}stddev`] = this.getNumber(snapshot.getStdDev());

        return {
            fields,
            measurement,
            tags: this.buildTags(ctx.registry, timer),
            timestamp: ctx.date,
        };
    }

    /**
     * Builds the prefix for a field name.
     *
     * @private
     * @param {Metric} metric
     * @returns {string}
     * @memberof InfluxMetricReporter
     */
    private getFieldNamePrefix(metric: Metric): string {
        if (metric.getGroup()) {
            return `${metric.getName()}.`;
        }
        return "";
    }

    /**
     * Builds the prefix for the metric name.
     *
     * @private
     * @param {Metric} metric
     * @returns {string}
     * @memberof InfluxMetricReporter
     */
    private getMeasurementName(metric: Metric): string {
        if (metric.getGroup()) {
            return metric.getGroup();
        }
        return metric.getName();
    }

}
