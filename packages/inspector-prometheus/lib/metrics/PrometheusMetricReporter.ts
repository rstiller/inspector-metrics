import "source-map-support";

import {
    BucketCounting,
    Buckets,
    Counter,
    Event,
    Gauge,
    Histogram,
    Meter,
    Metric,
    MetricRegistry,
    MetricReporter,
    MetricReporterOptions,
    MetricSetReportContext,
    MetricType,
    MonotoneCounter,
    OverallReportContext,
    ReportingResult,
    Sampling,
    StdClock,
    Taggable,
    Tags,
    Timer,
} from "inspector-metrics";

/**
 * Enumeration used to determine valid metric types of prometheus.
 */
type PrometheusMetricType = "counter" | "gauge" | "histogram" | "summary" | "untyped";

/**
 * Helper interface for reported fields.
 *
 * @interface PrometheusFields
 */
interface PrometheusFields { [key: string]: number | string; }

/**
 * Helper interface for a report result.
 *
 * @interface PrometheusMetricResult
 */
interface PrometheusMetricResult {
    readonly type: PrometheusMetricType;
    readonly fields: PrometheusFields;
    readonly canBeReported: boolean;
}

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
 * @interface PrometheusReporterOptions
 */
export interface PrometheusReporterOptions extends MetricReporterOptions {
    /**
     * indicates if UTC converted timestamps should be appended to each metric data
     *
     * @type {boolean}
     * @memberof PrometheusReporterOptions
     */
    readonly includeTimestamp?: boolean;
    /**
     * indicates if comments like HELP and TYPE should be emitted
     *
     * @type {boolean}
     * @memberof PrometheusReporterOptions
     */
    readonly emitComments?: boolean;
    /**
     * indicates if the untyped should always be used
     *
     * @type {boolean}
     * @memberof PrometheusReporterOptions
     */
    readonly useUntyped?: boolean;
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
export class PrometheusMetricReporter extends MetricReporter<PrometheusReporterOptions, PrometheusMetricResult> {

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
     * The prometheus counter type string.
     *
     * @private
     * @type {PrometheusMetricType}
     * @memberof PrometheusMetricReporter
     */
    private counterType: PrometheusMetricType = "counter";
    /**
     * The prometheus gauge type string.
     *
     * @private
     * @type {PrometheusMetricType}
     * @memberof PrometheusMetricReporter
     */
    private gaugeType: PrometheusMetricType = "gauge";
    /**
     * The prometheus histogram type string.
     *
     * @private
     * @type {PrometheusMetricType}
     * @memberof PrometheusMetricReporter
     */
    private histogramType: PrometheusMetricType = "histogram";
    /**
     * The prometheus summary type string.
     *
     * @private
     * @type {PrometheusMetricType}
     * @memberof PrometheusMetricReporter
     */
    private summaryType: PrometheusMetricType = "summary";

    /**
     * Creates an instance of PrometheusMetricReporter.
     *
     * @memberof PrometheusMetricReporter
     */
    public constructor({
        clock = new StdClock(),
        emitComments = true,
        includeTimestamp = false,
        minReportingTimeout = 1,
        tags = new Map(),
        useUntyped = false,
    }: PrometheusReporterOptions) {
        super({
            clock,
            emitComments,
            includeTimestamp,
            minReportingTimeout,
            tags,
            useUntyped,
        });
    }

    /**
     * Build the metric reporting string for all registered {@link MetricRegistry} instances.
     *
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    public async getMetricsString(): Promise<string> {
        if (this.metricRegistries && this.metricRegistries.length > 0) {
            const ctx = await this.report();
            return ctx.result;
        }
        return "\n";
    }

    /**
     * Builds the text representation of the event specified.
     *
     * @param {MetricRegistry} event
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    public async getEventString<TEventData, TEvent extends Event<TEventData>>(event: TEvent): Promise<string> {
        const overallCtx: OverallReportContext = {
            result: "",
        };

        const result = this.reportGauge(event, {
            date: null,
            metrics: [],
            overallCtx,
            registry: null,
            type: "gauge",
        });

        await this.handleResults(
            overallCtx,
            null,
            event.getTime(),
            "gauge",
            [{
                metric: event,
                result,
            }],
        );

        return overallCtx.result;
    }

    /**
     * Use {@link #getEventString} instead.
     *
     * @param {Event} event
     * @returns {Promise<Event>} always the specified event.
     * @memberof PrometheusMetricReporter
     */
    public async reportEvent<TEventData, TEvent extends Event<TEventData>>(event: TEvent): Promise<TEvent> {
        return event;
    }

    /**
     * Does nothing.
     *
     * @returns {Promise<void>}
     * @memberof PrometheusMetricReporter
     */
    public async flushEvents(): Promise<void> {
    }

    /**
     * Does nothing.
     *
     * @memberof PrometheusMetricReporter
     */
    public async start(): Promise<this> {
        return this;
    }

    /**
     * Does nothing.
     *
     * @memberof PrometheusMetricReporter
     */
    public async stop(): Promise<this> {
        return this;
    }

    /**
     * Called be before each reporting run.
     *
     * @protected
     * @memberof MetricReporter
     */
    protected async beforeReport(ctx: OverallReportContext) {
        ctx.result = "";
    }

    protected async handleResults(
        overallCtx: OverallReportContext,
        registry: MetricRegistry,
        date: Date,
        type: MetricType,
        results: Array<ReportingResult<any, PrometheusMetricResult>>): Promise<void> {
        const lines = [];
        for (const result of results) {
            const metric = result.metric;
            const ctx = result.result;
            const line = this.getMetricString(date, metric, ctx.type, ctx.canBeReported, ctx.fields);
            lines.push(line);
        }
        overallCtx.result += lines.join("\n");
    }

    protected reportCounter(
        counter: MonotoneCounter | Counter,
        ctx: MetricSetReportContext<MonotoneCounter | Counter>): PrometheusMetricResult {
        if (counter instanceof Counter) {
            return {
                canBeReported: true,
                fields: {
                    "": counter.getCount() || 0,
                },
                type: this.gaugeType,
            };
        }
        return {
            canBeReported: true,
            fields: {
                "": counter.getCount() || 0,
            },
            type: this.counterType,
        };
    }

    protected reportGauge(gauge: Gauge<any>, ctx: MetricSetReportContext<Gauge<any>>): PrometheusMetricResult {
        return {
            canBeReported: true,
            fields: {
                "": gauge.getValue(),
            },
            type: this.gaugeType,
        };
    }

    protected reportHistogram(histogram: Histogram, ctx: MetricSetReportContext<Histogram>): PrometheusMetricResult {
        return {
            canBeReported: !isNaN(histogram.getCount()),
            fields: {
                count: histogram.getCount() || 0,
                sum: histogram.getSum().toString() || 0,
            },
            type: this.histogramType,
        };
    }

    protected reportMeter(meter: Meter, ctx: MetricSetReportContext<Meter>): PrometheusMetricResult {
        return {
            canBeReported: !isNaN(meter.getCount()),
            fields: {
                "": meter.getCount() || 0,
            },
            type: this.gaugeType,
        };
    }

    protected reportTimer(timer: Timer, ctx: MetricSetReportContext<Timer>): PrometheusMetricResult {
        return {
            canBeReported: !isNaN(timer.getCount()),
            fields: {
                count: timer.getCount() || 0,
                sum: timer.getSum().toString() || 0,
            },
            type: this.summaryType,
        };
    }

    /**
     * Gets the mapping of tags with normalized names and filtered for reserved tags.
     *
     * @private
     * @param {Taggable} taggable
     * @param {string[]} exclude
     * @returns {Tags}
     * @memberof PrometheusMetricReporter
     */
    protected buildPrometheusTags(taggable: Taggable, exclude: string[]): Tags {
        exclude.sort();

        const tags: { [x: string]: string } = {};
        this.options.tags.forEach((value, key) => {
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

    /**
     * Builds the metric string based on the specified type of the metric instance.
     * Returns an empty string if the metric can't be reported - determined with the
     * specified function.
     *
     * @private
     * @template T
     * @param {Date} now
     * @param {T} metric
     * @param {PrometheusMetricType} metricType
     * @param {boolean} canReport
     * @param {PrometheusFields} fields
     * @returns {string}
     * @memberof PrometheusMetricReporter
     */
    private getMetricString<T extends Metric>(
        now: Date,
        metric: T,
        metricType: PrometheusMetricType,
        canReport: boolean,
        fields: PrometheusFields,
        ): string {

        if (!canReport) {
            return "";
        }

        const metricName = this.getMetricName(metric);
        const description = this.getDescription(metric, metricName);
        const timestamp = this.getTimestamp(now);
        const tags = this.buildPrometheusTags(metric, ["le", "quantile"]);
        const tagStr = Object
            .keys(tags)
            .map((tag) => `${tag}="${tags[tag]}"`)
            .join(",");
        let additionalFields = "";

        if (metricType === "histogram") {
            additionalFields = this.getBuckets(metric as any, metricName, fields["count"] as number, tagStr, timestamp);
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
            .keys(fields)
            .map((field) => {
                const fieldStr = PrometheusMetricReporter.isEmpty(field) ? "" : `_${field}`;
                const valueStr = this.getValue(fields[field]);

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

}
