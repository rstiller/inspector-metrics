import "source-map-support";

import {
    BucketCounting,
    Buckets,
    Clock,
    Counter,
    Gauge,
    Histogram,
    Meter,
    Metric,
    MetricRegistry,
    MetricReporter,
    MILLISECOND,
    MINUTE,
    MonotoneCounter,
    Sampling,
    StdClock,
    Taggable,
    Timer,
} from "inspector-metrics";

/**
 * Utility interface to track report-timestamps and -values of metric instances.
 * This is directly linked to the minimum-reporting timeout, which ensures
 * that a certain value gets reported at least in a certain amount of time
 * e.g. every minute without the value being having changed. On the other hand
 * to not report values that haven't changed.
 *
 * @interface MetricEntry
 */
interface MetricEntry {
    /**
     * timestamp of the latest report.
     *
     * @type {number}
     * @memberof MetricEntry
     */
    lastReport: number;
    /**
     * value that got reported as latest.
     *
     * @type {number}
     * @memberof MetricEntry
     */
    lastValue: number;
}

/**
 * Enumeration used to determine valid metric types of prometheus.
 */
type MetricType = "counter" | "gauge" | "histogram" | "summary" | "untyped";

/**
 * List of values between 0 and 1 representing the percent boundaries for reporting.
 *
 * @export
 * @class Percentiles
 */
export class Percentiles {

    /**
     * Name constant for assigning an instance of this class as metadata to a metric instance.
     *
     * @static
     * @memberof Percentiles
     */
    public static readonly METADATA_NAME = "quantiles";

    /**
     * Creates an instance of Percentiles.
     *
     * @param {number[]} [boundaries=[0.01, 0.05, 0.5, 0.75, 0.9, 0.95, 0.98, 0.99, 0.999]]
     * @memberof Percentiles
     */
    constructor(
        public boundaries: number[] = [0.01, 0.05, 0.5, 0.75, 0.9, 0.95, 0.98, 0.99, 0.999],
    ) {
        boundaries.sort((a: number, b: number) => a - b);
        boundaries.forEach((boundary) => {
            if (boundary <= 0.0) {
                throw new Error("boundaries cannot be smaller or eqaul to 0.0");
            }
            if (boundary >= 1.0) {
                throw new Error("boundaries cannot be greater or eqaul to 1.0");
            }
        });
    }

}

/**
 * Configuration object for {@link PrometheusMetricReporter}.
 *
 * @export
 * @class PrometheusReporterOptions
 */
export class PrometheusReporterOptions {

    /**
     * Creates an instance of PrometheusReporterOptions.
     *
     * @param {boolean} [includeTimestamp=false]
     *  indicates if UTC converted timestamps should be appended to each metric data
     * @param {boolean} [emitComments=true] indicates if comments like HELP and TYPE should be emitted
     * @param {boolean} [useUntyped=false] indicates if the untyped should always be used
     * @memberof PrometheusReporterOptions
     */
    constructor(
        public includeTimestamp: boolean = false,
        public emitComments: boolean = true,
        public useUntyped: boolean = false,
    ) {}

}

/**
 * Metric reporter for prometheus.
 * This reporter only support the text format of prometheus / open-metrics.
 *
 * To get the metric report call the {@link PrometheusMetricReporter#getMetricsString} method.
 *
 * @see https://prometheus.io/docs/concepts/
 * @see https://prometheus.io/docs/instrumenting/exposition_formats/#text-based-format
 * @export
 * @class PrometheusMetricReporter
 * @extends {MetricReporter}
 */
export class PrometheusMetricReporter extends MetricReporter {

    /**
     * Used to replace unsupported characters from label name.
     *
     * @private
     * @static
     * @memberof PrometheusMetricReporter
     */
    private static readonly LABEL_NAME_REPLACEMENT_REGEXP = new RegExp("[^a-zA-Z0-9_]", "g");
    /**
     * used to replace the first character of a label name if needed.
     *
     * @private
     * @static
     * @memberof PrometheusMetricReporter
     */
    private static readonly LABEL_NAME_START_EXCLUSION = ["_", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].sort();
    /**
     * Used to replace unsupported characters from metric name.
     *
     * @private
     * @static
     * @memberof PrometheusMetricReporter
     */
    private static readonly METRIC_NAME_REPLACEMENT_REGEXP = new RegExp("[^a-zA-Z0-9_:]", "g");
    /**
     * used to replace the first character of a metric name if needed.
     *
     * @private
     * @static
     * @memberof PrometheusMetricReporter
     */
    private static readonly METRIC_NAME_START_EXCLUSION = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].sort();

    /**
     * Checks if a given string is empty.
     *
     * @private
     * @static
     * @param {string} value
     * @returns {boolean}
     * @memberof PrometheusMetricReporter
     */
    private static isEmpty(value: string): boolean {
        return !value || value.trim() === "";
    }

    /**
     * Checks if a given value is a number.
     *
     * @private
     * @static
     * @param {*} value
     * @returns {value is number}
     * @memberof PrometheusMetricReporter
     */
    private static isNumber(value: any): value is number {
        return typeof(value) === "number";
    }

    /**
     * Configuration for the rendering of the metric report.
     *
     * @private
     * @type {PrometheusReporterOptions}
     * @memberof PrometheusMetricReporter
     */
    private options: PrometheusReporterOptions;
    /**
     * Clack instance used to determine the time for reports and minimal-reporting feature.
     *
     * @private
     * @type {Clock}
     * @memberof PrometheusMetricReporter
     */
    private clock: Clock;
    /**
     * Timeout in {@link MINUTE}s in which a certain metric needs to be included in the metric report.
     *
     * @private
     * @type {number}
     * @memberof PrometheusMetricReporter
     */
    private minReportingTimeout: number;
    /**
     * Common tags for this reporter.
     *
     * @private
     * @type {Map<string, string>}
     * @memberof PrometheusMetricReporter
     */
    private tags: Map<string, string>;
    /**
     * Keeps track of the reporting states for each metric.
     *
     * @private
     * @type {Map<number, MetricEntry>}
     * @memberof PrometheusMetricReporter
     */
    private metricStates: Map<number, MetricEntry> = new Map();
    /**
     * The prometheus counter type string.
     *
     * @private
     * @type {MetricType}
     * @memberof PrometheusMetricReporter
     */
    private counterType: MetricType = "counter";
    /**
     * The prometheus gauge type string.
     *
     * @private
     * @type {MetricType}
     * @memberof PrometheusMetricReporter
     */
    private gaugeType: MetricType = "gauge";
    /**
     * The prometheus histogram type string.
     *
     * @private
     * @type {MetricType}
     * @memberof PrometheusMetricReporter
     */
    private histogramType: MetricType = "histogram";
    /**
     * The prometheus summary type string.
     *
     * @private
     * @type {MetricType}
     * @memberof PrometheusMetricReporter
     */
    private summaryType: MetricType = "summary";

    /**
     * Creates an instance of PrometheusMetricReporter.
     *
     * @param {PrometheusReporterOptions} [options=new PrometheusReporterOptions()] configuration options
     * @param {Map<string, string>} [tags=new Map()]
     * @param {Clock} [clock=new StdClock()]
     * @param {number} [minReportingTimeout=1]
     *     timeout in minutes a metric need to be included in the report without having changed
     * @memberof PrometheusMetricReporter
     */
    public constructor(
        options: PrometheusReporterOptions = new PrometheusReporterOptions(),
        tags: Map<string, string> = new Map(),
        clock: Clock = new StdClock(),
        minReportingTimeout = 1) {
        super();

        this.options = options;
        this.tags = tags;
        this.clock = clock;
        this.minReportingTimeout = MINUTE.convertTo(minReportingTimeout, MILLISECOND);
    }

    /**
     * Gets the tags of this reporter.
     *
     * @returns {Map<string, string>}
     * @memberof PrometheusMetricReporter
     */
    public getTags(): Map<string, string> {
        return this.tags;
    }

    /**
     * Sets the tags for this reporter.
     *
     * @param {Map<string, string>} tags
     * @memberof PrometheusMetricReporter
     */
    public setTags(tags: Map<string, string>): void {
        this.tags = tags;
    }

    /**
     * Build the metric reporting string for all registered {@link MetricRegistry}s.
     *
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    public getMetricsString(): string {
        if (this.metricRegistries && this.metricRegistries.length > 0) {
            return this.metricRegistries
                .map((registry) => this.reportMetricRegistry(registry))
                .join("") + "\n";
        }
        return "\n";
    }

    /**
     * Does nothing.
     *
     * @memberof PrometheusMetricReporter
     */
    public start(): void {
    }

    /**
     * Does nothing.
     *
     * @memberof PrometheusMetricReporter
     */
    public stop(): void {
    }

    /**
     * Builds the reporting string for the specifed {@link MetricRegistry}.
     *
     * @private
     * @param {MetricRegistry} r
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    private reportMetricRegistry(r: MetricRegistry): string {
        const now: Date = new Date(this.clock.time().milliseconds);

        const monotoneCounters = this.reportMetrics(r.getMonotoneCounterList(), now,
            (c: MonotoneCounter) => this.getCounterString(now, c),
            (c: MonotoneCounter) => c.getCount());
        const counters = this.reportMetrics(r.getCounterList(), now,
            (c: Counter) => this.getCounterGaugeString(now, c),
            (c: Counter) => c.getCount());
        const gauges = this.reportMetrics(r.getGaugeList(), now,
            (g: Gauge<any>) => this.getGaugeString(now, g),
            (g: Gauge<any>) => g.getValue());
        const histograms = this.reportMetrics(r.getHistogramList(), now,
            (h: Histogram) => this.getHistogramString(now, h),
            (h: Histogram) => h.getCount());
        const meters = this.reportMetrics(r.getMeterList(), now,
            (m: Meter) => this.getMeterString(now, m),
            (m: Meter) => m.getCount());
        const timers = this.reportMetrics(r.getTimerList(), now,
            (t: Timer) => this.getTimerString(now, t),
            (t: Timer) => t.getCount());

        return []
            .concat(monotoneCounters)
            .concat(counters)
            .concat(gauges)
            .concat(histograms)
            .concat(meters)
            .concat(timers)
            .join("\n");
    }

    /**
     * Builds the reporting string for a group of metrics with the same type.
     *
     * @private
     * @template T
     * @param {T[]} metrics
     * @param {Date} date the date used to determine the timestamp from.
     * @param {(metric: T) => string} reportFn function called generate teh reporting string for a single metric
     * @param {(metric: Metric) => number} lastFn function to determine the latest value of a metric
     * @returns {string[]}
     * @memberof PrometheusMetricReporter
     */
    private reportMetrics<T extends Metric>(
        metrics: T[],
        date: Date,
        reportFn: (metric: T) => string,
        lastFn: (metric: Metric) => number): string[] {

        return metrics
            .filter((metric) => !(metric as any).id || this.hasChanged((metric as any).id, lastFn(metric), date))
            .map((metric) => reportFn(metric));
    }

    /**
     * Builds the metric string based on the specified type of the metric instance.
     * Returns an empty string if the metric can't be reported - determined with the
     * specified function.
     *
     * @private
     * @template T
     * @param {Date} now
     * @param {T} metric
     * @param {MetricType} metricType
     * @param {(metric: T) => boolean} canReport
     * @param {((metric: T) => { [key: string]: number | string; })} getValues
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    private getMetricString<T extends Metric>(
        now: Date,
        metric: T,
        metricType: MetricType,
        canReport: (metric: T) => boolean,
        getValues: (metric: T) => { [key: string]: number | string; },
        ): string {

        if (!canReport(metric)) {
            return "";
        }

        const metricName = this.getMetricName(metric);
        const description = this.getDescription(metric, metricName);
        const values = getValues(metric);
        const timestamp = this.getTimestamp(now);
        const tags = this.buildTags(metric, ["le", "quantile"]);
        const tagStr = Object
            .keys(tags)
            .map((tag) => `${tag}="${tags[tag]}"`)
            .join(",");
        let additionalFields = "";

        if (metricType === "histogram") {
            additionalFields = this.getBuckets(metric as any, metricName, values["count"] as number, tagStr, timestamp);
        } else if (metricType === "summary") {
            additionalFields = this.getQuantiles(metric as any, metricName, tagStr, timestamp);
        }

        if (this.options.useUntyped) {
            metricType = "untyped";
        }

        let comments = "";
        if (this.options.emitComments === true) {
            comments =  `# HELP ${metricName} ${description}\n` +
                        `# TYPE ${metricName} ${metricType}\n`;
        }

        return comments + additionalFields + Object
            .keys(values)
            .map((field) => {
                const fieldStr = PrometheusMetricReporter.isEmpty(field) ? "" : `_${field}`;
                const valueStr = this.getValue(values[field]);

                return `${metricName}${fieldStr}{${tagStr}} ${valueStr}${timestamp}\n`;
            })
            .join("");
    }

    /**
     * Builds the description for a metric instance based on the description property.
     * If no description was specified this function returns '<metric_name> description'.
     *
     * @private
     * @template T
     * @param {T} metric
     * @param {string} metricName
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    private getDescription<T extends Metric>(metric: T, metricName: string): string {
        let description = metric.getDescription();
        if (PrometheusMetricReporter.isEmpty(description)) {
            description = `${metricName} description`;
        }
        return description;
    }

    /**
     * Gets a numeric value in the correct format (mainly used to format +Inf and -Inf)
     *
     * @private
     * @param {*} value
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    private getValue(value: any): string {
        let valueStr = `${value}`;

        if (PrometheusMetricReporter.isNumber(value) && !Number.isFinite(value)) {
            if (value === -Infinity) {
                valueStr = "-Inf";
            } else if (value === Infinity) {
                valueStr = "+Inf";
            }
        }

        return valueStr;
    }

    /**
     * Gets the UTC timestamp.
     *
     * @private
     * @param {Date} now
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    private getTimestamp(now: Date): string {
        return this.options.includeTimestamp ? ` ${now.getUTCMilliseconds()}` : "";
    }

    /**
     * Builds the string for bucket data lines.
     *
     * @private
     * @template T
     * @param {T} metric
     * @param {string} metricName
     * @param {number} count
     * @param {string} tagStr
     * @param {string} timestamp
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    private getBuckets<T extends Metric & BucketCounting>(
        metric: T,
        metricName: string,
        count: number,
        tagStr: string,
        timestamp: string): string {

        const buckets: Buckets = metric.getBuckets();
        if (buckets) {
            const tagPrefix = !PrometheusMetricReporter.isEmpty(tagStr) ? "," : "";
            const bucketStrings: string[] = [];

            metric
                .getCounts()
                .forEach((bucketCount: number, boundary: number) => {
                    bucketStrings.push(
                        `${metricName}_bucket{${tagStr}${tagPrefix}le="${boundary}"} ${bucketCount}${timestamp}`,
                    );
                });

            return bucketStrings.join("\n") +
                `\n${metricName}_bucket{${tagStr}${tagPrefix}le="+Inf"} ${count}${timestamp}\n`;
        }

        return "";
    }

    /**
     * Builds the string for percentile data lines.
     *
     * @private
     * @template T
     * @param {T} metric
     * @param {string} metricName
     * @param {string} tagStr
     * @param {string} timestamp
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    private getQuantiles<T extends Metric & Sampling>(
        metric: T,
        metricName: string,
        tagStr: string,
        timestamp: string): string {

        let quantiles: Percentiles = metric.getMetadata(Percentiles.METADATA_NAME);
        if (!quantiles) {
            quantiles = new Percentiles();
        }
        const tagPrefix = !PrometheusMetricReporter.isEmpty(tagStr) ? "," : "";
        const snapshot = metric.getSnapshot();

        return quantiles
            .boundaries
            .map((boundary) => {
                const value = snapshot.getValue(boundary);
                return `${metricName}{${tagStr}${tagPrefix}quantile="${boundary}"} ${value}${timestamp}`;
            })
            .join("\n") + "\n";
    }

    /**
     * Builds the reporting string for monotone counter types using {@link PrometheusMetricReporter#getMetricString}.
     *
     * @private
     * @param {Date} now
     * @param {MonotoneCounter} counter
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    private getCounterString(now: Date, counter: MonotoneCounter): string {
        return this.getMetricString(
            now,
            counter,
            this.counterType,
            (metric) => true,
            (metric) => ({
                "": counter.getCount() || 0,
            }));
    }

    /**
     * Builds the reporting string for counter types using {@link PrometheusMetricReporter#getMetricString}.
     *
     * @private
     * @param {Date} now
     * @param {Counter} counter
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    private getCounterGaugeString(now: Date, counter: Counter): string {
        return this.getMetricString(
            now,
            counter,
            this.gaugeType,
            (metric) => true,
            (metric) => ({
                "": counter.getCount() || 0,
            }));
    }

    /**
     * Builds the reporting string for gauge types using {@link PrometheusMetricReporter#getMetricString}.
     *
     * @private
     * @param {Date} now
     * @param {Gauge<any>} gauge
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    private getGaugeString(now: Date, gauge: Gauge<any>): string {
        return this.getMetricString(
            now,
            gauge,
            this.gaugeType,
            (metric) => true,
            (metric) => ({
                "": gauge.getValue(),
            }));
    }

    /**
     * Builds the reporting string for histogram types using {@link PrometheusMetricReporter#getMetricString}.
     *
     * @private
     * @param {Date} now
     * @param {Histogram} histogram
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    private getHistogramString(now: Date, histogram: Histogram): string {
        return this.getMetricString(
            now,
            histogram,
            this.histogramType,
            (metric) => !isNaN(histogram.getCount()),
            (metric) => ({
                count: histogram.getCount() || 0,
                sum: histogram.getSum().toString() || 0,
            }));
    }

    /**
     * Builds the reporting string for meter types using {@link PrometheusMetricReporter#getMetricString}.
     *
     * @private
     * @param {Date} now
     * @param {Meter} meter
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    private getMeterString(now: Date, meter: Meter): string {
        return this.getMetricString(
            now,
            meter,
            this.gaugeType,
            (metric) => !isNaN(meter.getCount()),
            (metric) => ({
                "": meter.getCount() || 0,
            }));
    }

    /**
     * Builds the reporting string for timer types using {@link PrometheusMetricReporter#getMetricString}.
     *
     * @private
     * @param {Date} now
     * @param {Timer} timer
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    private getTimerString(now: Date, timer: Timer): string {
        return this.getMetricString(
            now,
            timer,
            this.summaryType,
            (metric) => !isNaN(timer.getCount()),
            (metric) => ({
                count: timer.getCount() || 0,
                sum: timer.getSum().toString() || 0,
            }));
    }

    /**
     * Determines if a metric instance has changed it's value since the last check.
     * This is always true is the minimal-reporting timeout was reached.
     *
     * @private
     * @param {number} metricId
     * @param {number} lastValue
     * @param {Date} date
     * @returns {boolean}
     * @memberof PrometheusMetricReporter
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
     * Gets the normalized metric name.
     *
     * @private
     * @param {Metric} metric
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    private getMetricName(metric: Metric): string {
        let name = metric.getName();
        if (metric.getGroup()) {
            name = `${metric.getGroup()}:${metric.getName()}`;
        }

        name = name.replace(PrometheusMetricReporter.METRIC_NAME_REPLACEMENT_REGEXP, "_");
        if (PrometheusMetricReporter.METRIC_NAME_START_EXCLUSION.indexOf(name.charAt(0)) !== -1) {
            name = "_" + name.slice(1);
        }
        return name;
    }

    /**
     * Gets the mapping of tags with normalized names and filtered for reserved tags.
     *
     * @private
     * @param {Taggable} taggable
     * @param {string[]} exclude
     * @returns {{ [key: string]: string }}
     * @memberof PrometheusMetricReporter
     */
    private buildTags(taggable: Taggable, exclude: string[]): { [key: string]: string } {
        exclude.sort();

        const tags: { [x: string]: string } = {};
        this.tags.forEach((value, key) => {
            const normalizedKey = key.replace(PrometheusMetricReporter.LABEL_NAME_REPLACEMENT_REGEXP, "_");
            if (exclude.indexOf(normalizedKey) === -1 &&
                PrometheusMetricReporter.LABEL_NAME_START_EXCLUSION.indexOf(normalizedKey.charAt(0)) === -1) {
                tags[normalizedKey] = value;
            }
        });
        taggable.getTags().forEach((value, key) => {
            const normalizedKey = key.replace(PrometheusMetricReporter.LABEL_NAME_REPLACEMENT_REGEXP, "_");
            if (exclude.indexOf(normalizedKey) === -1 &&
                PrometheusMetricReporter.LABEL_NAME_START_EXCLUSION.indexOf(normalizedKey.charAt(0)) === -1) {
                tags[normalizedKey] = value;
            }
        });
        return tags;
    }

}
