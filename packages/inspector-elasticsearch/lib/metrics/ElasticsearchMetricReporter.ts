import "source-map-support/register";

import { Client, ConfigOptions } from "elasticsearch";
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
 * Enumeration of all metric types.
 */
export type MetricType = "counter" | "gauge" | "histogram" | "meter" | "timer";

/**
 * Interface for getting a certain information using the specified emtric metadata -
 * e.g. name of the index, metric type, etc.
 */
export type MetricInfoDeterminator = (registry: MetricRegistry, metric: Metric, type: MetricType, date: Date) => string;

/**
 * Interface for building a document for a metric.
 */
export type MetricDocumentBuilder = (
    registry: MetricRegistry,
    metric: Metric,
    type: MetricType,
    date: Date,
    tags: Map<string, string>) => {};

/**
 * A MetricReporter extension used to publish metric values to elasticsearch.
 *
 * @export
 * @class ElasticsearchMetricReporter
 * @extends {MetricReporter}
 */
export class ElasticsearchMetricReporter extends MetricReporter {

    /**
     * Returns a {@link MetricInfoDeterminator} that returns 'metric' as type.
     *
     * @static
     * @returns {MetricInfoDeterminator}
     * @memberof ElasticsearchMetricReporter
     */
    public static defaultTypeDeterminator(): MetricInfoDeterminator {
        return (registry: MetricRegistry, metric: Metric, type: MetricType, date: Date) => "metric";
    }

    /**
     * Returns a {@link MetricInfoDeterminator} that returns an indexname like '<baseName>-yyyy-mm-dd'.
     *
     * @static
     * @param {string} baseName The
     * @returns {MetricInfoDeterminator}
     * @memberof ElasticsearchMetricReporter
     */
    public static dailyIndex(baseName: string): MetricInfoDeterminator {
        return (registry: MetricRegistry, metric: Metric, type: MetricType, date: Date) => {
            const day = date.getDate();
            const dayPrefix: string = (day >= 10) ? "" : "0";
            const month = date.getMonth() + 1;
            const monthPrefix: string = (month >= 10) ? "" : "0";
            return `${baseName}-${date.getFullYear()}-${monthPrefix}${month}-${dayPrefix}${day}`;
        };
    }

    /**
     * Returns a {@link MetricDocumentBuilder} that builds an object for a metric like this:
     *
     * {
     *
     *  name: ..., // name of metric
     *
     *  group: ..., // group of metric
     *
     *  timestamp: ..., // timestamp from parameter
     *
     *  tags: ..., // combined tags from this reporter and the metric
     *
     *  values..., // metric specific values
     *
     *  type..., // metric type
     *
     * }
     *
     * @static
     * @returns {MetricDocumentBuilder}
     * @memberof ElasticsearchMetricReporter
     */
    public static defaultDocumentBuilder(): MetricDocumentBuilder {
        return (
            registry: MetricRegistry,
            metric: Metric,
            type: MetricType,
            timestamp: Date,
            commonTags: Map<string, string>) => {

            let values = null;

            if (metric instanceof MonotoneCounter) {
                values = ElasticsearchMetricReporter.getMonotoneCounterValues(metric);
            } else if (metric instanceof Counter) {
                values = ElasticsearchMetricReporter.getCounterValues(metric);
            } else if (metric instanceof Histogram) {
                values = ElasticsearchMetricReporter.getHistogramValues(metric);
            } else if (metric instanceof Meter) {
                values = ElasticsearchMetricReporter.getMeterValues(metric);
            } else if (metric instanceof Timer) {
                values = ElasticsearchMetricReporter.getTimerValues(metric);
            } else {
                values = ElasticsearchMetricReporter.getGaugeValue(metric as Gauge<any>);
            }

            if (values === null) {
                return null;
            }

            const tags = ElasticsearchMetricReporter.buildTags(commonTags, metric);
            const name = metric.getName();
            const group = metric.getGroup();
            return { name, group, tags, timestamp, values, type };
        };
    }

    /**
     * Combines all specified tags.
     *
     * @static
     * @param {Map<string, string>} commonTags - read-only tags from reporter - get with reporter.getTags().
     * @param {Taggable} taggable - mostly a metric with tags.
     * @returns {{ [key: string]: string }} Returns a key-value object with all tags combined.
     * @memberof ElasticsearchMetricReporter
     */
    public static buildTags(commonTags: Map<string, string>, taggable: Taggable): { [key: string]: string } {
        const tags: { [x: string]: string } = {};
        commonTags.forEach((tag, key) => tags[key] = tag);
        taggable.getTags().forEach((tag, key) => tags[key] = tag);
        return tags;
    }

    /**
     * Gets the values for the specified monotone counter metric.
     *
     * @static
     * @param {MonotoneCounter} counter
     * @returns {{}}
     * @memberof ElasticsearchMetricReporter
     */
    public static getMonotoneCounterValues(counter: MonotoneCounter): {} {
        const count = counter.getCount();
        if (!count || isNaN(count)) {
            return null;
        }
        return { count };
    }

    /**
     * Gets the values for the specified counter metric.
     *
     * @static
     * @param {Counter} counter
     * @returns {{}}
     * @memberof ElasticsearchMetricReporter
     */
    public static getCounterValues(counter: Counter): {} {
        const count = counter.getCount();
        if (!count || isNaN(count)) {
            return null;
        }
        return { count };
    }

    /**
     * Gets the values for the specified {Gauge} metric.
     *
     * @static
     * @param {Gauge<any>} gauge
     * @returns {{}}
     * @memberof ElasticsearchMetricReporter
     */
    public static getGaugeValue(gauge: Gauge<any>): {} {
        const value = gauge.getValue();
        if (!value || isNaN(value)) {
            return null;
        }
        return { value };
    }

    /**
     * Gets the values for the specified {Histogram} metric.
     *
     * @static
     * @param {Histogram} histogram
     * @returns {{}}
     * @memberof ElasticsearchMetricReporter
     */
    public static getHistogramValues(histogram: Histogram): {} {
        const value = histogram.getCount();
        if (!value || isNaN(value)) {
            return null;
        }
        const snapshot = histogram.getSnapshot();
        const values: any = {};

        values[`count`] = value;
        values[`max`] = this.getNumber(snapshot.getMax());
        values[`mean`] = this.getNumber(snapshot.getMean());
        values[`min`] = this.getNumber(snapshot.getMin());
        values[`p50`] = this.getNumber(snapshot.getMedian());
        values[`p75`] = this.getNumber(snapshot.get75thPercentile());
        values[`p95`] = this.getNumber(snapshot.get95thPercentile());
        values[`p98`] = this.getNumber(snapshot.get98thPercentile());
        values[`p99`] = this.getNumber(snapshot.get99thPercentile());
        values[`p999`] = this.getNumber(snapshot.get999thPercentile());
        values[`stddev`] = this.getNumber(snapshot.getStdDev());

        return values;
    }

    /**
     * Gets the values for the specified {Meter} metric.
     *
     * @static
     * @param {Meter} meter
     * @returns {{}}
     * @memberof ElasticsearchMetricReporter
     */
    public static getMeterValues(meter: Meter): {} {
        const value = meter.getCount();
        if (!value || isNaN(value)) {
            return null;
        }
        const values: any = {};

        values[`count`] = value;
        values[`m15_rate`] = this.getNumber(meter.get15MinuteRate());
        values[`m1_rate`] = this.getNumber(meter.get1MinuteRate());
        values[`m5_rate`] = this.getNumber(meter.get5MinuteRate());
        values[`mean_rate`] = this.getNumber(meter.getMeanRate());

        return values;
    }

    /**
     * Gets the values for the specified {Timer} metric.
     *
     * @static
     * @param {Timer} timer
     * @returns {{}}
     * @memberof ElasticsearchMetricReporter
     */
    public static getTimerValues(timer: Timer): {} {
        const value = timer.getCount();
        if (!value || isNaN(value)) {
            return null;
        }
        const snapshot = timer.getSnapshot();
        const values: any = {};

        values[`count`] = value;
        values[`m15_rate`] = this.getNumber(timer.get15MinuteRate());
        values[`m1_rate`] = this.getNumber(timer.get1MinuteRate());
        values[`m5_rate`] = this.getNumber(timer.get5MinuteRate());
        values[`max`] = this.getNumber(snapshot.getMax());
        values[`mean`] = this.getNumber(snapshot.getMean());
        values[`mean_rate`] = this.getNumber(timer.getMeanRate());
        values[`min`] = this.getNumber(snapshot.getMin());
        values[`p50`] = this.getNumber(snapshot.getMedian());
        values[`p75`] = this.getNumber(snapshot.get75thPercentile());
        values[`p95`] = this.getNumber(snapshot.get95thPercentile());
        values[`p98`] = this.getNumber(snapshot.get98thPercentile());
        values[`p99`] = this.getNumber(snapshot.get99thPercentile());
        values[`p999`] = this.getNumber(snapshot.get999thPercentile());
        values[`stddev`] = this.getNumber(snapshot.getStdDev());

        return values;
    }

    /**
     * Either gets 0 or the specifed value.
     *
     * @private
     * @param {number} value
     * @returns {number}
     * @memberof ElasticsearchMetricReporter
     */
    private static getNumber(value: number): number {
        if (isNaN(value)) {
            return 0;
        }
        return value;
    }

    /**
     * Clock used to determine the current timestamp.
     *
     * @private
     * @type {Clock}
     * @memberof ElasticsearchMetricReporter
     */
    private clock: Clock;
    /**
     * Reference for the object returned by the scheduler function.
     *
     * @private
     * @type {NodeJS.Timer}
     * @memberof ElasticsearchMetricReporter
     */
    private timer: NodeJS.Timer;
    /**
     * Reporting interval.
     *
     * @private
     * @type {number}
     * @memberof ElasticsearchMetricReporter
     */
    private interval: number;
    /**
     * Minimal timeout to include a metric instance into a reporting.
     *
     * @private
     * @type {number}
     * @memberof ElasticsearchMetricReporter
     */
    private minReportingTimeout: number;
    /**
     * Time unit for the reporting interval.
     *
     * @private
     * @type {TimeUnit}
     * @memberof ElasticsearchMetricReporter
     */
    private unit: TimeUnit;
    /**
     * Tags assigned to this reporter instance - reported for every metric instance.
     *
     * @private
     * @type {Map<string, string>}
     * @memberof ElasticsearchMetricReporter
     */
    private tags: Map<string, string>;
    /**
     * Metadata for the logger.
     *
     * @private
     * @type {*}
     * @memberof ElasticsearchMetricReporter
     */
    private logMetadata: any;
    /**
     * Minimal logger interface to report failures.
     *
     * @private
     * @type {Logger}
     * @memberof ElasticsearchMetricReporter
     */
    private log: Logger = console;
    /**
     * Saves the state of each reported metrics.
     *
     * @private
     * @type {Map<number, MetricEntry>}
     * @memberof ElasticsearchMetricReporter
     */
    private metricStates: Map<number, MetricEntry> = new Map();
    /**
     * Elasticsearch client used to do reporting.
     *
     * @private
     * @type {Client}
     * @memberof ElasticsearchMetricReporter
     */
    private client: Client;
    /**
     * Used to get the name of the index.
     *
     * @private
     * @type {MetricInfoDeterminator}
     * @memberof ElasticsearchMetricReporter
     */
    private indexnameDeterminator: MetricInfoDeterminator;
    /**
     * Used to get the type of the metric instance.
     *
     * @private
     * @type {MetricInfoDeterminator}
     * @memberof ElasticsearchMetricReporter
     */
    private typeDeterminator: MetricInfoDeterminator;
    /**
     * Used to build the document for a metric.
     *
     * @private
     * @type {MetricDocumentBuilder}
     * @memberof ElasticsearchMetricReporter
     */
    private metricDocumentBuilder: MetricDocumentBuilder;

    /**
     * Creates an instance of ElasticsearchMetricReporter.
     *
     * @param {ConfigOptions} clientOptions Elasticsearch client config.
     * @param [metricDocumentBuilder] A function that constructs an object of a metric that's gonna be indexed.
     * @param [indexnameDeterminator] A function that determines the name of the index for a given metric.
     * @param [typeDeterminator] A function that determines the name of the type for a given metric.
     * @param {number} [interval=1000] The reporting interval.
     * @param {TimeUnit} [unit=MILLISECOND] The time unit for the reporting interval.
     * @param {Map<string, string>} [tags=new Map()] Tags assigned to every metric.
     * @param {Clock} [clock=new StdClock()] The clock - used to determine the timestamp of the metrics while reporting.
     * @param {number} [minReportingTimeout=1] The time in minutes the reporter sends even unchanged metrics.
     */
    public constructor(
        clientOptions: ConfigOptions,
        metricDocumentBuilder: MetricDocumentBuilder = ElasticsearchMetricReporter.defaultDocumentBuilder(),
        indexnameDeterminator: MetricInfoDeterminator = ElasticsearchMetricReporter.dailyIndex("metric"),
        typeDeterminator: MetricInfoDeterminator = ElasticsearchMetricReporter.defaultTypeDeterminator(),
        interval: number = 1000,
        unit: TimeUnit = MILLISECOND,
        tags: Map<string, string> = new Map(),
        clock: Clock = new StdClock(),
        minReportingTimeout = 1) {
        super();

        this.indexnameDeterminator = indexnameDeterminator;
        this.typeDeterminator = typeDeterminator;
        this.metricDocumentBuilder = metricDocumentBuilder;
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

        this.client = new Client(clientOptions);
    }

    /**
     * Gets the reporter tags.
     *
     * @returns {Map<string, string>}
     * @memberof ElasticsearchMetricReporter
     */
    public getTags(): Map<string, string> {
        return this.tags;
    }

    /**
     * Sets the reporter tags.
     *
     * @param {Map<string, string>} tags
     * @memberof ElasticsearchMetricReporter
     */
    public setTags(tags: Map<string, string>): void {
        this.tags = tags;
    }

    /**
     * Gets the logger instance.
     *
     * @returns {Logger}
     * @memberof ElasticsearchMetricReporter
     */
    public getLog(): Logger {
        return this.log;
    }

    /**
     * Sets the logger instance.
     *
     * @param {Logger} log
     * @memberof ElasticsearchMetricReporter
     */
    public setLog(log: Logger): void {
        this.log = log;
    }

    /**
     * Starts the logger reporting loop using {setInterval()}.
     *
     * @memberof ElasticsearchMetricReporter
     */
    public start(): void {
        const interval: number = this.unit.convertTo(this.interval, MILLISECOND);
        this.timer = setInterval(() => this.report(), interval);
    }

    /**
     * Stopps reporting metrics.
     *
     * @memberof ElasticsearchMetricReporter
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
     * @memberof ElasticsearchMetricReporter
     */
    private async report() {
        this.metricRegistries.forEach((registry) => this.reportMetricRegistry(registry));
    }

    /**
     * Reports the data points for the specified {@link MetricRegistry}.
     *
     * @private
     * @param {MetricRegistry} registry
     * @memberof ElasticsearchMetricReporter
     */
    private reportMetricRegistry(registry: MetricRegistry): void {
        const now: Date = new Date(this.clock.time().milliseconds);

        this.reportMetrics(registry, registry.getMonotoneCounterList(), now, "counter",
            (counter: MonotoneCounter) => counter.getCount());
        this.reportMetrics(registry, registry.getCounterList(), now, "counter",
            (counter: Counter) => counter.getCount());
        this.reportMetrics(registry, registry.getGaugeList(), now, "gauge",
            (gauge: Gauge<any>) => gauge.getValue());
        this.reportMetrics(registry, registry.getHistogramList(), now, "histogram",
            (histogram: Histogram) => histogram.getCount());
        this.reportMetrics(registry, registry.getMeterList(), now, "meter",
            (meter: Meter) => meter.getCount());
        this.reportMetrics(registry, registry.getTimerList(), now, "timer",
            (timer: Timer) => timer.getCount());
    }

    /**
     * Reports a collection of metric instance for a certain type.
     *
     * @private
     * @template T
     * @param {MetricRegistry} registry
     * @param {T[]} metrics
     * @param {Date} date
     * @param {MetricType} type
     * @param {(metric: Metric) => number} lastModifiedFunction
     *      function to determine if a metric has a different value since the last reporting.
     * @returns {Promise<void>}
     * @memberof ElasticsearchMetricReporter
     */
    private async reportMetrics<T extends Metric>(
        registry: MetricRegistry,
        metrics: T[],
        date: Date,
        type: MetricType,
        lastModifiedFunction: (metric: Metric) => number): Promise<void> {

        const body: Array<{}> = [];
        metrics.forEach((metric) => {
            const metricId = (metric as any).id;
            let changed = true;
            if (metricId) {
                changed = this.hasChanged(metricId, lastModifiedFunction(metric), date);
            }

            if (changed) {
                const document = this.metricDocumentBuilder(registry, metric, type, date, this.tags);
                if (!!document) {
                    // tslint:disable-next-line:variable-name
                    const _index = this.indexnameDeterminator(registry, metric, type, date);
                    // tslint:disable-next-line:variable-name
                    const _type = this.typeDeterminator(registry, metric, type, date);
                    body.push({ index: { _index, _type } });
                    body.push(document);
                }
            }
        });

        if (body.length > 0) {
            try {
                const response = await this.client.bulk({ body });
                if (this.log) {
                    this.log.debug(
                        `took ${response.took}ms to write ${type} metrics - errors ${response.errors}`,
                        this.logMetadata,
                    );
                }
            } catch (reason) {
                if (this.log) {
                    this.log.error(`error writing ${type} metrics - reason: ${reason}`, reason, this.logMetadata);
                }
            }
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
     * @memberof ElasticsearchMetricReporter
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

}
