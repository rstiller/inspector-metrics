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
    MetricReporter,
    MILLISECOND,
    MINUTE,
    StdClock,
    Taggable,
    Timer,
    TimeUnit,
} from "inspector-metrics";

/**
 * Enumeration of all metric types.
 */
export type MetricType = "counter" | "gauge" | "histogram" | "meter" | "timer";

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
 * Entry interface to track the last value and timestamp of a metric instance.
 *
 * @interface MetricEntry
 */
interface MetricEntry {
    /**
     * Timestamp of the last reporting.
     *
     * @type {number}
     * @memberof MetricEntry
     */
    lastReport: number;

    /**
     * Last reported reference value.
     *
     * @type {number}
     * @memberof MetricEntry
     */
    lastValue: number;
}

/**
 * InfluxDB reporter implementation.
 *
 * @export
 * @class InfluxMetricReporter
 * @extends {MetricReporter}
 */
export class InfluxMetricReporter extends MetricReporter {

    /**
     * Clock used to determine the current timestamp.
     *
     * @private
     * @type {Clock}
     * @memberof InfluxMetricReporter
     */
    private clock: Clock;
    /**
     * Reference for the object returned by the scheduler function.
     *
     * @private
     * @type {NodeJS.Timer}
     * @memberof InfluxMetricReporter
     */
    private timer: NodeJS.Timer;
    /**
     * Reporting interval.
     *
     * @private
     * @type {number}
     * @memberof InfluxMetricReporter
     */
    private interval: number;
    /**
     * Minimal timeout to include a metric instance into a reporting.
     *
     * @private
     * @type {number}
     * @memberof InfluxMetricReporter
     */
    private minReportingTimeout: number;
    /**
     * Time unit for the reporting interval.
     *
     * @private
     * @type {TimeUnit}
     * @memberof InfluxMetricReporter
     */
    private unit: TimeUnit;
    /**
     * Tags assigned to this reporter instance - reported for every metric instance.
     *
     * @private
     * @type {Map<string, string>}
     * @memberof InfluxMetricReporter
     */
    private tags: Map<string, string>;
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
     * Minimal logger interface to report failures.
     *
     * @private
     * @type {Logger}
     * @memberof InfluxMetricReporter
     */
    private log: Logger = console;
    /**
     * Sender instance used to report metrics.
     *
     * @private
     * @type {Sender}
     * @memberof InfluxMetricReporter
     */
    private sender: Sender;
    /**
     * Saves the state of each reported metrics.
     *
     * @private
     * @type {Map<number, MetricEntry>}
     * @memberof InfluxMetricReporter
     */
    private metricStates: Map<number, MetricEntry> = new Map();

    /**
     * Creates an instance of InfluxMetricReporter.
     *
     * @param {Sender} sender The influx sender instance.
     * @param {number} [interval=1000] The reporting interval.
     * @param {TimeUnit} [unit=MILLISECOND] The time unit for the reporting interval.
     * @param {Map<string, string>} [tags=new Map()] Tags assigned to every metric.
     * @param {Clock} [clock=new StdClock()] The clock - used to determine the timestamp of the metrics while reporting.
     * @param {number} [minReportingTimeout=1] The time in minutes the report sends even unchanged metrics.
     * @memberof InfluxMetricReporter
     */
    public constructor(
        sender: Sender,
        interval: number = 1000,
        unit: TimeUnit = MILLISECOND,
        tags: Map<string, string> = new Map(),
        clock: Clock = new StdClock(),
        minReportingTimeout = 1) {
        super();

        this.sender = sender;
        this.interval = interval;
        this.unit = unit;
        this.tags = tags;
        this.clock = clock;
        this.minReportingTimeout = MINUTE.convertTo(minReportingTimeout, MILLISECOND);

        this.logMetadata = {
            interval,
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

        this.sender.init()
            .then(() => unlock());
    }

    /**
     * Gets the reporter tags.
     *
     * @returns {Map<string, string>}
     * @memberof InfluxMetricReporter
     */
    public getTags(): Map<string, string> {
        return this.tags;
    }

    /**
     * Sets the reporter tags.
     *
     * @param {Map<string, string>} tags
     * @memberof InfluxMetricReporter
     */
    public setTags(tags: Map<string, string>): void {
        this.tags = tags;
    }

    /**
     * Gets the logger instance.
     *
     * @returns {Logger}
     * @memberof InfluxMetricReporter
     */
    public getLog(): Logger {
        return this.log;
    }

    /**
     * Sets the logger instance.
     *
     * @param {Logger} log
     * @memberof InfluxMetricReporter
     */
    public setLog(log: Logger): void {
        this.log = log;
    }

    /**
     * Uses the scheduler function to trigger periodical reporting.
     *
     * @memberof InfluxMetricReporter
     */
    public start(): void {
        const interval: number = this.unit.convertTo(this.interval, MILLISECOND);
        this.timer = setInterval(() => this.report(), interval);
    }

    /**
     * Stops the timer reference returned by the scheduler function.
     *
     * @memberof InfluxMetricReporter
     */
    public stop(): void {
        if (this.timer) {
            this.timer.unref();
        }
    }

    /**
     * Reports the data points for each registered {@link MetricRegistry}.
     *
     * @private
     * @memberof InfluxMetricReporter
     */
    private async report() {
        const senderReady = await this.sender.isReady();
        if (senderReady && this.metricRegistries && this.metricRegistries.length > 0) {
            this.metricRegistries.forEach((registry) => this.reportMetricRegistry(registry));
        }
    }

    /**
     * Reports the data points for the specified {@link MetricRegistry}.
     *
     * @private
     * @param {MetricRegistry} registry
     * @memberof InfluxMetricReporter
     */
    private reportMetricRegistry(registry: MetricRegistry): void {
        const now: Date = new Date(this.clock.time().milliseconds);

        this.reportMetrics(registry.getCounterList(), now, "counter",
            (counter: Counter, date: Date) => this.reportCounter(counter, date),
            (counter: Counter) => counter.getCount());
        this.reportMetrics(registry.getGaugeList(), now, "gauge",
            (gauge: Gauge<any>, date: Date) => this.reportGauge(gauge, date),
            (gauge: Gauge<any>) => gauge.getValue());
        this.reportMetrics(registry.getHistogramList(), now, "histogram",
            (histogram: Histogram, date: Date) => this.reportHistogram(histogram, date),
            (histogram: Histogram) => histogram.getCount());
        this.reportMetrics(registry.getMeterList(), now, "meter",
            (meter: Meter, date: Date) => this.reportMeter(meter, date),
            (meter: Meter) => meter.getCount());
        this.reportMetrics(registry.getTimerList(), now, "timer",
            (timer: Timer, date: Date) => this.reportTimer(timer, date),
            (timer: Timer) => timer.getCount());
    }

    /**
     * Reports a collection of metric instance for a certain type.
     *
     * @private
     * @template T
     * @param {T[]} metrics
     * @param {Date} date
     * @param {MetricType} type the type to report.
     * @param {(metric: Metric, date: Date) => IPoint} reportFunction
     *      The function to build the data points for a certain metric.
     * @param {(metric: Metric) => number} lastModifiedFunction
     *      function to determine if a metric has a different value since the last reporting.
     * @memberof InfluxMetricReporter
     */
    private reportMetrics<T extends Metric>(
        metrics: T[],
        date: Date,
        type: MetricType,
        reportFunction: (metric: Metric, date: Date) => IPoint,
        lastModifiedFunction: (metric: Metric) => number): void {

        const points: IPoint[] = [];
        metrics.forEach((metric) => {
            const metricId = (metric as any).id;
            let changed = true;
            if (metricId) {
                changed = this.hasChanged(metricId, lastModifiedFunction(metric), date);
            }

            if (changed) {
                const point = reportFunction(metric, date);
                if (!!point) {
                    points.push(point);
                }
            }
        });
        if (points.length > 0) {
            this.sendPoints(points, type);
        }
    }

    /**
     * Determines if the specified metric has changed. This is always true if
     * the minimum-reporting timeout was reached.
     *
     * @private
     * @param {number} metricId
     * @param {number} lastValue
     * @param {Date} date
     * @returns {boolean}
     * @memberof InfluxMetricReporter
     */
    private hasChanged(metricId: number, lastValue: number, date: Date): boolean {
        let changed = true;
        let metricEntry = {
            lastReport: 0,
            lastValue,
        };
        if (this.metricStates.has(metricId)) {
            metricEntry = this.metricStates.get(metricId);
            changed = metricEntry.lastValue !== lastValue;
            if (!changed) {
                changed = metricEntry.lastReport + this.minReportingTimeout < date.getTime();
            }
        }
        if (changed) {
            metricEntry.lastReport = date.getTime();
        }
        this.metricStates.set(metricId, metricEntry);
        return changed;
    }

    /**
     * Computes and reports the fields of the counter.
     *
     * @private
     * @param {Counter} counter
     * @param {Date} date
     * @returns {IPoint}
     * @memberof InfluxMetricReporter
     */
    private reportCounter(counter: Counter, date: Date): IPoint {
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
            tags: this.buildTags(counter),
            timestamp: date,
        };
    }

    /**
     * Computes and reports the fields of the gauge.
     *
     * @private
     * @param {Gauge<any>} gauge
     * @param {Date} date
     * @returns {IPoint}
     * @memberof InfluxMetricReporter
     */
    private reportGauge(gauge: Gauge<any>, date: Date): IPoint {
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
            tags: this.buildTags(gauge),
            timestamp: date,
        };
    }

    /**
     * Computes and reports the fields of the histogram.
     *
     * @private
     * @param {Histogram} histogram
     * @param {Date} date
     * @returns {IPoint}
     * @memberof InfluxMetricReporter
     */
    private reportHistogram(histogram: Histogram, date: Date): IPoint {
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
            tags: this.buildTags(histogram),
            timestamp: date,
        };
    }

    /**
     * Computes and reports the fields of the meter.
     *
     * @private
     * @param {Meter} meter
     * @param {Date} date
     * @returns {IPoint}
     * @memberof InfluxMetricReporter
     */
    private reportMeter(meter: Meter, date: Date): IPoint {
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
            tags: this.buildTags(meter),
            timestamp: date,
        };
    }

    /**
     * Computes and reports the fields of the timer.
     *
     * @private
     * @param {Timer} timer
     * @param {Date} date
     * @returns {IPoint}
     * @memberof InfluxMetricReporter
     */
    private reportTimer(timer: Timer, date: Date): IPoint {
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
            tags: this.buildTags(timer),
            timestamp: date,
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

    /**
     * Builds the tags using the metric's tags and this reportes tags.
     *
     * @private
     * @param {Taggable} taggable
     * @returns {{ [key: string]: string }}
     * @memberof InfluxMetricReporter
     */
    private buildTags(taggable: Taggable): { [key: string]: string } {
        const tags: { [x: string]: string } = {};
        this.tags.forEach((tag, key) => tags[key] = tag);
        taggable.getTags().forEach((tag, key) => tags[key] = tag);
        return tags;
    }

    /**
     * Uses the sender to report the given data points.
     *
     * @private
     * @param {IPoint[]} points
     * @param {MetricType} type
     * @memberof InfluxMetricReporter
     */
    private sendPoints(points: IPoint[], type: MetricType) {
        this.queue.push(async (callback: () => void) => {
            try {
                await this.sender.send(points);
                if (this.log) {
                    this.log.debug(`wrote ${type} metrics`, this.logMetadata);
                }
            } catch (reason) {
                if (this.log) {
                    this.log.error(`error writing ${type} metrics - reason: ${reason}`, reason, this.logMetadata);
                }
            } finally {
                callback();
            }
        });
    }

    /**
     * Either gets 0 or the specifed value.
     *
     * @private
     * @param {number} value
     * @returns {number}
     * @memberof InfluxMetricReporter
     */
    private getNumber(value: number): number {
        if (isNaN(value)) {
            return 0;
        }
        return value;
    }

}
