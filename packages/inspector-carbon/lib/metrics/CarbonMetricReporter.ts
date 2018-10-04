import "source-map-support/register";

/**
 * Graphite / carbon client module.
 */
const graphite = require("graphite");

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
    MonotoneCounter,
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
 * Metric reporter for graphite / carbon.
 *
 * @export
 * @class CarbonMetricReporter
 * @extends {MetricReporter}
 */
export class CarbonMetricReporter extends MetricReporter {

    /**
     * The graphite / carbon host.
     *
     * @private
     * @type {string}
     * @memberof CarbonMetricReporter
     */
    private host: string;
    /**
     * Clock used to determine the current timestamp.
     *
     * @private
     * @type {Clock}
     * @memberof CarbonMetricReporter
     */
    private clock: Clock;
    /**
     * Reference for the object returned by the scheduler function.
     *
     * @private
     * @type {NodeJS.Timer}
     * @memberof CarbonMetricReporter
     */
    private timer: NodeJS.Timer;
    /**
     * Reporting interval.
     *
     * @private
     * @type {number}
     * @memberof CarbonMetricReporter
     */
    private interval: number;
    /**
     * Minimal timeout to include a metric instance into a reporting.
     *
     * @private
     * @type {number}
     * @memberof CarbonMetricReporter
     */
    private minReportingTimeout: number;
    /**
     * Time unit for the reporting interval.
     *
     * @private
     * @type {TimeUnit}
     * @memberof CarbonMetricReporter
     */
    private unit: TimeUnit;
    /**
     * Tags assigned to this reporter instance - reported for every metric instance.
     *
     * @private
     * @type {Map<string, string>}
     * @memberof CarbonMetricReporter
     */
    private tags: Map<string, string>;
    /**
     * Metadata for the logger.
     *
     * @private
     * @type {*}
     * @memberof CarbonMetricReporter
     */
    private logMetadata: any;
    /**
     * Minimal logger interface to report failures.
     *
     * @private
     * @type {Logger}
     * @memberof CarbonMetricReporter
     */
    private log: Logger = console;
    /**
     * Saves the state of each reported metrics.
     *
     * @private
     * @type {Map<number, MetricEntry>}
     * @memberof CarbonMetricReporter
     */
    private metricStates: Map<number, MetricEntry> = new Map();
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
     * @param {string} host The carbon/graphite host.
     * @param {number} [interval=1000] The reporting interval.
     * @param {TimeUnit} [unit=MILLISECOND] The time unit for the reporting interval.
     * @param {Map<string, string>} [tags=new Map()] Tags assigned to every metric.
     * @param {Clock} [clock=new StdClock()] The clock - used to determine the timestamp of the metrics while reporting.
     * @param {number} [minReportingTimeout=1] The time in minutes the report sends even unchanged metrics.
     * @memberof CarbonMetricReporter
     */
    public constructor(
        host: string,
        interval: number = 1000,
        unit: TimeUnit = MILLISECOND,
        tags: Map<string, string> = new Map(),
        clock: Clock = new StdClock(),
        minReportingTimeout = 1) {
        super();

        this.host = host;
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
    }

    /**
     * Gets the reporter tags.
     *
     * @returns {Map<string, string>}
     * @memberof CarbonMetricReporter
     */
    public getTags(): Map<string, string> {
        return this.tags;
    }

    /**
     * Sets the reporter tags.
     *
     * @param {Map<string, string>} tags
     * @memberof CarbonMetricReporter
     */
    public setTags(tags: Map<string, string>): void {
        this.tags = tags;
    }

    /**
     * Gets the logger instance.
     *
     * @returns {Logger}
     * @memberof CarbonMetricReporter
     */
    public getLog(): Logger {
        return this.log;
    }

    /**
     * Sets the logger instance.
     *
     * @param {Logger} log
     * @memberof CarbonMetricReporter
     */
    public setLog(log: Logger): void {
        this.log = log;
    }

    /**
     * Uses the scheduler function to trigger periodical reporting.
     *
     * @memberof CarbonMetricReporter
     */
    public start(): void {
        const interval: number = this.unit.convertTo(this.interval, MILLISECOND);

        this.client = graphite.createClient(this.host);
        this.timer = setInterval(() => this.report(), interval);
    }

    /**
     * Stops the timer reference returned by the scheduler function.
     *
     * @memberof CarbonMetricReporter
     */
    public stop(): void {
        if (this.timer) {
            this.timer.unref();
        }
        if (this.client) {
            this.client.end();
        }
    }

    /**
     * Reports the data points for each registered {@link MetricRegistry}.
     *
     * @private
     * @memberof CarbonMetricReporter
     */
    private async report() {
        this.metricRegistries.forEach((registry) => this.reportMetricRegistry(registry));
    }

    /**
     * Reports the data points for the specified {@link MetricRegistry}.
     *
     * @private
     * @param {MetricRegistry} registry
     * @memberof CarbonMetricReporter
     */
    private reportMetricRegistry(registry: MetricRegistry): void {
        const now: Date = new Date(this.clock.time().milliseconds);

        this.reportMetrics(registry.getMonotoneCounterList(), now, "counter",
            (counter: MonotoneCounter, date: Date) => this.reportMonotoneCounter(counter, date),
            (counter: MonotoneCounter) => counter.getCount());
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
     * @param {MetricType} type
     * @param {(metric: Metric, date: Date) => {}} reportFunction
     *      The function to build the data points for a certain metric.
     * @param {(metric: Metric) => number} lastModifiedFunction
     *      function to determine if a metric has a different value since the last reporting.
     * @memberof CarbonMetricReporter
     */
    private reportMetrics<T extends Metric>(
        metrics: T[],
        date: Date,
        type: MetricType,
        reportFunction: (metric: Metric, date: Date) => {},
        lastModifiedFunction: (metric: Metric) => number): void {

        metrics.forEach((metric) => {
            const metricId = (metric as any).id;
            let changed = true;
            if (metricId) {
                changed = this.hasChanged(metricId, lastModifiedFunction(metric), date);
            }

            if (changed) {
                const measurement = reportFunction(metric, date);
                if (!!measurement) {
                    this.sendMetric(metric, date, measurement);
                }
            }
        });
    }

    /**
     * Uses the client instance to report the given metric.
     *
     * @private
     * @param {Metric} metric
     * @param {Date} timestamp
     * @param {{}} measurement
     * @memberof CarbonMetricReporter
     */
    private sendMetric(metric: Metric, timestamp: Date, measurement: {}) {
        const tags = this.buildTags(this.getTags(), metric);
        this.client.writeTagged(measurement, tags, timestamp, (err: any) => {
            if (err != null) {
                this.log.error(err, this.logMetadata);
            }
        });
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
     * @memberof CarbonMetricReporter
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
     * Builds the tags using the metric's tags and this reportes tags.
     *
     * @private
     * @param {Map<string, string>} commonTags
     * @param {Taggable} taggable
     * @returns {{ [key: string]: string }}
     * @memberof CarbonMetricReporter
     */
    private buildTags(commonTags: Map<string, string>, taggable: Taggable): { [key: string]: string } {
        const tags: { [x: string]: string } = {};
        commonTags.forEach((tag, key) => tags[key] = tag);
        taggable.getTags().forEach((tag, key) => tags[key] = tag);
        return tags;
    }

    /**
     * Either gets 0 or the specifed value.
     *
     * @private
     * @param {number} value
     * @returns {number}
     * @memberof CarbonMetricReporter
     */
    private getNumber(value: number): number {
        if (isNaN(value)) {
            return 0;
        }
        return value;
    }

    /**
     * Computes and reports the fields of the monotone-counter.
     *
     * @private
     * @param {MonotoneCounter} counter
     * @param {Date} date
     * @returns {{}}
     * @memberof CarbonMetricReporter
     */
    private reportMonotoneCounter(counter: MonotoneCounter, date: Date): {} {
        const value = counter.getCount();
        if (!value || isNaN(value)) {
            return null;
        }
        const measurement: any = {
            group: counter.getGroup(),
            name: counter.getName(),
        };
        measurement[`count`] = counter.getCount() || 0;

        return measurement;
    }

    /**
     * Computes and reports the fields of the counter.
     *
     * @private
     * @param {Counter} counter
     * @param {Date} date
     * @returns {{}}
     * @memberof CarbonMetricReporter
     */
    private reportCounter(counter: Counter, date: Date): {} {
        const value = counter.getCount();
        if (!value || isNaN(value)) {
            return null;
        }
        const measurement: any = {
            group: counter.getGroup(),
            name: counter.getName(),
        };
        measurement[`count`] = counter.getCount() || 0;

        return measurement;
    }

    /**
     * Computes and reports the fields of the gauge.
     *
     * @private
     * @param {Gauge<any>} gauge
     * @param {Date} date
     * @returns {{}}
     * @memberof CarbonMetricReporter
     */
    private reportGauge(gauge: Gauge<any>, date: Date): {} {
        const value = gauge.getValue();
        if (!value || isNaN(value)) {
            return null;
        }
        const measurement: any = {
            group: gauge.getGroup(),
            name: gauge.getName(),
        };
        measurement[`value`] = gauge.getValue() || 0;

        return measurement;
    }

    /**
     * Computes and reports the fields of the histogram.
     *
     * @private
     * @param {Histogram} histogram
     * @param {Date} date
     * @returns {{}}
     * @memberof CarbonMetricReporter
     */
    private reportHistogram(histogram: Histogram, date: Date): {} {
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

        return measurement;
    }

    /**
     * Computes and reports the fields of the meter.
     *
     * @private
     * @param {Meter} meter
     * @param {Date} date
     * @returns {{}}
     * @memberof CarbonMetricReporter
     */
    private reportMeter(meter: Meter, date: Date): {} {
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

        return measurement;
    }

    /**
     * Computes and reports the fields of the timer.
     *
     * @private
     * @param {Timer} timer
     * @param {Date} date
     * @returns {{}}
     * @memberof CarbonMetricReporter
     */
    private reportTimer(timer: Timer, date: Date): {} {
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

        return measurement;
    }

}
