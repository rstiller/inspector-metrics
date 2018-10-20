import "source-map-support";

import {
    Clock,
    Counter,
    Gauge,
    Histogram,
    Meter,
    Metric,
    MetricRegistry,
    MetricReporter,
    MILLISECOND,
    MonotoneCounter,
    Scheduler,
    StdClock,
    Taggable,
    Timer,
    TimeUnit,
} from "inspector-metrics";
import * as moment from "moment-timezone";

/**
 * Enumeration of all metric types.
 */
export type MetricType = "counter" | "gauge" | "histogram" | "meter" | "timer";

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
 * Lists all possible column types.
 */
export type ColumnType = "date" | "name" | "field" | "group" | "description" | "value" | "tags" | "type" | "metadata";

/**
 * Shortcut type for a row.
 */
export type Row = string[];

/**
 * Shortcut type for many rows.
 */
export type Rows = Row[];

/**
 * Type for a tag or metadata filter.
 */
export type Filter = (metric: Metric, key: string, value: string) => Promise<boolean>;

/**
 * Helper interface for tags.
 *
 * @interface Tags
 */
interface Tags {
    [key: string]: string;
}

/**
 * Helper interface for Fields.
 *
 * @interface Fields
 */
interface Fields {
    [field: string]: string;
}

/**
 * Tags and metadata can be exported in one row or in separate rows.
 *
 * @export
 * @enum {number}
 */
export enum ExportMode {
    ALL_IN_ONE_COLUMN,
    EACH_IN_OWN_COLUMN,
}

/**
 * Delegation interface for writing the actual value to a file.
 *
 * @export
 * @interface CsvFileWriter
 */
export interface CsvFileWriter {

    /**
     * Called on every metrics-report run one time - behaviour is implementation specific.
     *
     * @param {Row} header
     * @returns {Promise<void>}
     * @memberof CsvFileWriter
     */
    init(header: Row): Promise<void>;

    /**
     * Called for each field of each metric and after init finished - behaviour is implementation specific.
     *
     * @param {Metric} metric
     * @param {Row} values
     * @returns {Promise<void>}
     * @memberof CsvFileWriter
     */
    writeRow(metric: Metric, values: Row): Promise<void>;
}

/**
 * Options for {@link CsvMetricReporter}.
 *
 * @export
 * @class CsvMetricReporterOptions
 */
export class CsvMetricReporterOptions {

    /**
     * The writer used to store the rows.
     *
     * @type {CsvFileWriter}
     * @memberof CsvMetricReporterOptions
     */
    public readonly writer: CsvFileWriter;
    /**
     * Reporting interval.
     *
     * @type {number}
     * @memberof CsvMetricReporterOptions
     */
    public readonly interval: number;
    /**
     * TimeUnit of the reporting interval.
     *
     * @type {TimeUnit}
     * @memberof CsvMetricReporterOptions
     */
    public readonly unit: TimeUnit;
    /**
     * Indicates that single quotes are used instead of double quotes.
     *
     * @type {boolean}
     * @memberof CsvMetricReporterOptions
     */
    public readonly useSingleQuotes: boolean;
    /**
     * ExportMode for tags.
     *
     * @type {ExportMode}
     * @memberof CsvMetricReporterOptions
     */
    public readonly tagExportMode: ExportMode;
    /**
     * ExportMode for metadata.
     *
     * @type {ExportMode}
     * @memberof CsvMetricReporterOptions
     */
    public readonly metadataExportMode: ExportMode;
    /**
     * Prefix for tag columns if exported separately.
     *
     * @type {string}
     * @memberof CsvMetricReporterOptions
     */
    public readonly tagColumnPrefix: string;
    /**
     * Delimiter between the tags if exported in one column.
     *
     * @type {string}
     * @memberof CsvMetricReporterOptions
     */
    public readonly tagDelimiter: string;
    /**
     * Prefix for metadata columns if exported separately.
     *
     * @type {string}
     * @memberof CsvMetricReporterOptions
     */
    public readonly metadataColumnPrefix: string;
    /**
     * Delimiter between the metadata if exported in one column.
     *
     * @type {string}
     * @memberof CsvMetricReporterOptions
     */
    public readonly metadataDelimiter: string;
    /**
     * The columns to export.
     *
     * @type {ColumnType[]}
     * @memberof CsvMetricReporterOptions
     */
    public readonly columns: ColumnType[];
    /**
     * The format for the date column.
     *
     * @type {string}
     * @memberof CsvMetricReporterOptions
     */
    public readonly dateFormat: string;
    /**
     * The timezone used to determine the date.
     *
     * @type {string}
     * @memberof CsvMetricReporterOptions
     */
    public readonly timezone: string;
    /**
     * An async filter function used to filter out unwanted tags.
     *
     * @type {Filter}
     * @memberof CsvMetricReporterOptions
     */
    public readonly tagFilter: Filter;
    /**
     * An async filter function used to filter out unwanted metadata.
     *
     * @type {Filter}
     * @memberof CsvMetricReporterOptions
     */
    public readonly metadataFilter: Filter;

    public constructor({
        writer,
        interval = 1000,
        unit = MILLISECOND,
        useSingleQuotes = false,
        tagExportMode = ExportMode.ALL_IN_ONE_COLUMN,
        metadataExportMode = ExportMode.ALL_IN_ONE_COLUMN,
        tagColumnPrefix = "tag_",
        tagDelimiter = ";",
        metadataColumnPrefix = "meta_",
        metadataDelimiter = ";",
        columns = [],
        dateFormat = "YYYYMMDDHHmmss.SSSZ",
        timezone = "UTC",
        tagFilter = async () => true,
        metadataFilter = async () => true,
    }: {
        /**
         * The writer used to store the rows.
         *
         * @type {CsvFileWriter}
         */
        writer: CsvFileWriter,
        /**
         * Reporting interval.
         *
         * @type {number}
         */
        interval?: number,
        /**
         * TimeUnit of the reporting interval.
         *
         * @type {TimeUnit}
         */
        unit?: TimeUnit,
        /**
         * Indicates that single quotes are used instead of double quotes.
         *
         * @type {boolean}
         */
        useSingleQuotes?: boolean,
        /**
         * ExportMode for tags.
         *
         * @type {ExportMode}
         */
        tagExportMode?: ExportMode,
        /**
         * ExportMode for metadata.
         *
         * @type {ExportMode}
         */
        metadataExportMode?: ExportMode,
        /**
         * Prefix for tag columns if exported separately.
         *
         * @type {string}
         */
        tagColumnPrefix?: string,
        /**
         * Delimiter between the tags if exported in one column.
         *
         * @type {string}
         */
        tagDelimiter?: string,
        /**
         * Prefix for metadata columns if exported separately.
         *
         * @type {string}
         */
        metadataColumnPrefix?: string,
        /**
         * Delimiter between the metadata if exported in one column.
         *
         * @type {string}
         */
        metadataDelimiter?: string,
        /**
         * The columns to export.
         *
         * @type {ColumnType[]}
         */
        columns?: ColumnType[],
        /**
         * The format for the date column.
         *
         * @type {string}
         */
        dateFormat?: string,
        /**
         * The timezone used to determine the date.
         *
         * @type {string}
         */
        timezone?: string,
        /**
         * An async filter function used to filter out unwanted tags.
         */
        tagFilter?: (metric: Metric, tag: string, value: string) => Promise<boolean>,
        /**
         * An async filter function used to filter out unwanted metadata.
         */
        metadataFilter?: (metric: Metric, key: string, value: any) => Promise<boolean>,
    }) {
        this.writer = writer;
        this.interval = interval;
        this.unit = unit;
        this.useSingleQuotes = useSingleQuotes;
        this.tagExportMode = tagExportMode;
        this.metadataExportMode = metadataExportMode;
        this.tagColumnPrefix = tagColumnPrefix;
        this.tagDelimiter = tagDelimiter;
        this.metadataColumnPrefix = metadataColumnPrefix;
        this.metadataDelimiter = metadataDelimiter;
        this.columns = columns;
        this.dateFormat = dateFormat;
        this.timezone = timezone;
        this.tagFilter = tagFilter;
        this.metadataFilter = metadataFilter;
    }
}

/**
 * Metric reporter for csv files.
 *
 * @export
 * @class CsvMetricReporter
 * @extends {MetricReporter}
 */
export class CsvMetricReporter extends MetricReporter {

    /**
     * The options for this reporter.
     *
     * @private
     * @type {CsvMetricReporterOptions}
     * @memberof CsvMetricReporter
     */
    private readonly options: CsvMetricReporterOptions;
    /**
     * Common tags applied to each metric while reporting.
     *
     * @private
     * @type {Map<string, string>}
     * @memberof CsvMetricReporter
     */
    private tags: Map<string, string> = new Map();
    /**
     * The clock used to determine the state of change of a certain metric.
     *
     * @private
     * @type {Clock}
     * @memberof CsvMetricReporter
     */
    private clock: Clock;
    /**
     * Maximum amount of time in seconds a metric
     * that has not changed it's value is not reported.
     *
     * @private
     * @type {number}
     * @memberof CsvMetricReporter
     */
    private minReportingTimeout: number;
    /**
     * Scheduler function.
     *
     * @private
     * @type {Scheduler}
     * @memberof CsvMetricReporter
     */
    private scheduler: Scheduler;
    /**
     * Timer reference.
     *
     * @private
     * @type {NodeJS.Timer}
     * @memberof CsvMetricReporter
     */
    private timer: NodeJS.Timer;
    /**
     * Helper Map for holding the state / last value of a metric.
     *
     * @private
     * @type {Map<number, MetricEntry>}
     * @memberof CsvMetricReporter
     */
    private metricStates: Map<number, MetricEntry> = new Map();
    /**
     * Header row.
     *
     * @private
     * @type {Row}
     * @memberof CsvMetricReporter
     */
    private header: Row;
    /**
     * All metadata names
     *
     * @private
     * @type {string[]}
     * @memberof CsvMetricReporter
     */
    private metadataNames: string[] = [];
    /**
     * All tags names.
     *
     * @private
     * @type {string[]}
     * @memberof CsvMetricReporter
     */
    private tagsNames: string[] = [];

    /**
     * Creates an instance of CsvMetricReporter.
     *
     * @param {CsvMetricReporterOptions} options
     * @param {Map<string, string>} [tags=new Map()]
     * @param {Clock} [clock=new StdClock()]
     * @param {number} [minReportingTimeout=1]
     *          timeout in minutes a metric need to be included in the report without having changed
     * @param {Scheduler} [scheduler=setInterval]
     * @memberof CsvMetricReporter
     */
    public constructor(
        options: CsvMetricReporterOptions,
        tags: Map<string, string> = new Map(),
        clock: Clock = new StdClock(),
        minReportingTimeout = 1,
        scheduler: Scheduler = setInterval) {
        super();

        this.options = options;
        this.tags = tags;
        this.clock = clock;
        this.minReportingTimeout = minReportingTimeout;
        this.scheduler = scheduler;
    }

    /**
     * Gets back all tags.
     *
     * @returns {Map<string, string>}
     * @memberof CsvMetricReporter
     */
    public getTags(): Map<string, string> {
        return this.tags;
    }

    /**
     * Sets the common tags.
     *
     * @param {Map<string, string>} tags
     * @memberof CsvMetricReporter
     */
    public setTags(tags: Map<string, string>): void {
        this.tags = tags;
    }

    /**
     * Builds all headers and starts scheduling reporting runs.
     * When call this method all metatdata and tags in each metric
     * in the application need to be set / known, otherwise it cannot be
     * reported.
     *
     * @returns {Promise<void>}
     * @memberof CsvMetricReporter
     */
    public async start(): Promise<void> {
        const interval: number = this.options.unit.convertTo(this.options.interval, MILLISECOND);
        if (this.metricRegistries && this.metricRegistries.length > 0) {
            this.header = await this.buildHeaders();
        }
        this.timer = this.scheduler(() => this.report(), interval);
    }

    /**
     * Stops the reporting.
     *
     * @memberof CsvMetricReporter
     */
    public stop(): void {
        if (this.timer) {
            this.timer.unref();
        }
    }

    /**
     * Calls the init method of the file writer and reports all metrics.
     *
     * @private
     * @memberof CsvMetricReporter
     */
    private async report() {
        if (this.metricRegistries && this.metricRegistries.length > 0) {
            await this.options.writer.init(this.header);
            this.metricRegistries.forEach((registry) => this.reportMetricRegistry(registry));
        }
    }

    /**
     * Builds a row / string array with all headers. Also updated the internal data of the reporter.
     *
     * @private
     * @returns {Promise<Row>}
     * @memberof CsvMetricReporter
     */
    private async buildHeaders(): Promise<Row> {
        const headers: Row = [];

        for (const columnType of this.options.columns) {
            if (columnType === "metadata" && this.options.metadataExportMode === ExportMode.EACH_IN_OWN_COLUMN) {
                const metadataNames = this.getAllMetadataKeys();
                const filteredNames = await this.filterKeys(metadataNames, this.options.metadataFilter);
                filteredNames.forEach((metadataName) => {
                    headers.push(`${this.options.metadataColumnPrefix}${metadataName}`);
                    this.metadataNames.push(metadataName);
                });
            } else if (columnType === "tags" && this.options.tagExportMode === ExportMode.EACH_IN_OWN_COLUMN) {
                const tagNames = this.getAllTagKeys();
                const filteredTags = await this.filterKeys(tagNames, this.options.tagFilter);
                filteredTags.forEach((tag) => {
                    headers.push(`${this.options.tagColumnPrefix}${tag}`);
                    this.tagsNames.push(tag);
                });
            } else {
                headers.push(columnType);
            }
        }

        return headers;
    }

    /**
     * Filters the given set of strings using the given filter and returns the filtered set.
     *
     * @private
     * @param {Set<string>} keys
     * @param {Filter} filter
     * @returns {Promise<Set<string>>}
     * @memberof CsvMetricReporter
     */
    private async filterKeys(keys: Set<string>, filter: Filter): Promise<Set<string>> {
        const filteredKeys = new Set();
        const tasks: Array<Promise<any>> = [];
        keys.forEach((key) => {
            tasks.push((async () => {
                if (!filter || await filter(null, key, null)) {
                    filteredKeys.add(key);
                }
            })());
        });
        await Promise.all(tasks);
        return filteredKeys;
    }

    /**
     * Gets all metadata keys - no filtering.
     *
     * @private
     * @returns {Set<string>}
     * @memberof CsvMetricReporter
     */
    private getAllMetadataKeys(): Set<string> {
        const metadataNames = new Set();
        this.metricRegistries
            .map((registry) => registry.getMetricList())
            .map((metrics) => metrics.map((metric) => metric.getMetadataMap()))
            .forEach((metadataMapArray) => {
                metadataMapArray.forEach((metadataMap) => {
                    for (const metadataName of metadataMap.keys()) {
                        metadataNames.add(metadataName);
                    }
                });
            });
        return metadataNames;
    }

    /**
     * Gets all tag names - no filtering.
     *
     * @private
     * @returns {Set<string>}
     * @memberof CsvMetricReporter
     */
    private getAllTagKeys(): Set<string> {
        const tags = new Set();
        this.tags.forEach((value, tag) => tags.add(tag));
        this.metricRegistries
            .map((registry) => registry.getMetricList())
            .map((metrics) => metrics.map((metric) => this.buildTags(metric)))
            .forEach((metricTagsArray) => {
                metricTagsArray.forEach((metricTags) => {
                    Object.keys(metricTags).forEach((tag) => tags.add(tag));
                });
            });
        return tags;
    }

    /**
     * Triggers the reporting for the given {@link MetricRegistry}.
     *
     * @private
     * @param {MetricRegistry} registry
     * @memberof CsvMetricReporter
     */
    private reportMetricRegistry(registry: MetricRegistry): void {
        const date: Date = new Date(this.clock.time().milliseconds);
        const now: string = moment.tz(date, this.options.timezone).format(this.options.dateFormat);

        this.reportMetrics(registry.getMonotoneCounterList(), date, now, "counter",
            (counter: MonotoneCounter) => this.reportCounter(counter),
            (counter: MonotoneCounter) => counter.getCount());
        this.reportMetrics(registry.getCounterList(), date, now, "counter",
            (counter: Counter) => this.reportCounter(counter),
            (counter: Counter) => counter.getCount());
        this.reportMetrics(registry.getGaugeList(), date, now, "gauge",
            (gauge: Gauge<any>) => this.reportGauge(gauge),
            (gauge: Gauge<any>) => gauge.getValue());
        this.reportMetrics(registry.getHistogramList(), date, now, "histogram",
            (histogram: Histogram) => this.reportHistogram(histogram),
            (histogram: Histogram) => histogram.getCount());
        this.reportMetrics(registry.getMeterList(), date, now, "meter",
            (meter: Meter) => this.reportMeter(meter),
            (meter: Meter) => meter.getCount());
        this.reportMetrics(registry.getTimerList(), date, now, "timer",
            (timer: Timer) => this.reportTimer(timer),
            (timer: Timer) => timer.getCount());
    }

    /**
     * Builds and writes the rows of the given metrics of the given type.
     *
     * @private
     * @template T
     * @param {T[]} metrics
     * @param {Date} date
     * @param {string} dateStr
     * @param {MetricType} type
     * @param {(metric: Metric) => Fields} reportFunction
     * @param {(metric: Metric) => number} lastModifiedFunction
     * @memberof CsvMetricReporter
     */
    private reportMetrics<T extends Metric>(
        metrics: T[],
        date: Date,
        dateStr: string,
        type: MetricType,
        reportFunction: (metric: Metric) => Fields,
        lastModifiedFunction: (metric: Metric) => number): void {

        metrics.forEach((metric) => {
            const metricId = (metric as any).id;
            let changed = true;
            if (metricId) {
                changed = this.hasChanged(metricId, lastModifiedFunction(metric), date);
            }

            if (changed) {
                const fields = reportFunction(metric);
                if (fields) {
                    const rows: Rows = [];
                    for (const field of Object.keys(fields)) {
                        const row = this.buildRow(dateStr, metric, type, field, fields[field]);
                        rows.push(row);
                    }
                    if (rows.length > 0) {
                        this.writeRows(metric, rows, type);
                    }
                }
            }
        });
    }

    /**
     * Builds the row of a single metric.
     *
     * @private
     * @template T
     * @param {string} dateStr
     * @param {T} metric
     * @param {MetricType} type
     * @param {string} field
     * @param {string} value
     * @returns {Row}
     * @memberof CsvMetricReporter
     */
    private buildRow<T extends Metric>(
        dateStr: string,
        metric: T,
        type: MetricType,
        field: string,
        value: string): Row {

        const quote = this.options.useSingleQuotes === true ? "'" : "\"";
        const row: Row = [];
        const tags = this.buildTags(metric);

        let metadataStr = "";
        if (this.options.metadataExportMode === ExportMode.ALL_IN_ONE_COLUMN) {
            metric.getMetadataMap().forEach((metadataValue, metadataName) => {
                metadataStr += `${metadataName}=${quote}${metadataValue}${quote}${this.options.metadataDelimiter}`;
            });
            metadataStr = metadataStr.slice(0, -1);
        }

        let tagStr = "";
        if (this.options.tagExportMode === ExportMode.ALL_IN_ONE_COLUMN) {
            tagStr = Object.keys(tags)
                .map((tag) => `${tag}=${quote}${tags[tag]}${quote}`)
                .join(this.options.tagDelimiter);
        }

        for (const columnType of this.options.columns) {
            switch (columnType) {
                case "date":
                    row.push(dateStr);
                    break;
                case "description":
                    let desc = encodeURIComponent(metric.getDescription() || "");
                    if (quote === "'") {
                        desc = desc.replace(/'/g, "\\'");
                    }
                    row.push(`${quote}${desc}${quote}`);
                    break;
                case "field":
                    row.push(`${quote}${field || ""}${quote}`);
                    break;
                case "group":
                    row.push(`${quote}${metric.getGroup() || ""}${quote}`);
                    break;
                case "metadata":
                    if (this.options.metadataExportMode === ExportMode.ALL_IN_ONE_COLUMN) {
                        row.push(metadataStr);
                    } else {
                        for (const metadata of this.metadataNames) {
                            row.push(`${quote}${metric.getMetadata(metadata) || ""}${quote}`);
                        }
                    }
                    break;
                case "name":
                    row.push(`${quote}${metric.getName() || ""}${quote}`);
                    break;
                case "tags":
                    if (this.options.tagExportMode === ExportMode.ALL_IN_ONE_COLUMN) {
                        row.push(tagStr);
                    } else {
                        for (const tag of this.tagsNames) {
                            row.push(`${quote}${tags[tag] || ""}${quote}`);
                        }
                    }
                    break;
                case "type":
                    row.push(`${quote}${type || ""}${quote}`);
                    break;
                case "value":
                    row.push(value || "");
                    break;
                default:
            }
        }

        return row;
    }

    /**
     * Determines if the value of a metric has changed - always true if the minimum
     * reporting timeout is elapsed.
     *
     * @private
     * @param {number} metricId
     * @param {number} lastValue
     * @param {Date} date
     * @returns {boolean}
     * @memberof CsvMetricReporter
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
     * Gathers the fields for a counter metric.
     *
     * @private
     * @param {MonotoneCounter} counter
     * @returns {Fields}
     * @memberof CsvMetricReporter
     */
    private reportCounter(counter: MonotoneCounter): Fields {
        return {
            count: `${counter.getCount()}`,
        };
    }

    /**
     * Gathers the fields for a gauge metric.
     *
     * @private
     * @param {Gauge<any>} gauge
     * @returns {Fields}
     * @memberof CsvMetricReporter
     */
    private reportGauge(gauge: Gauge<any>): Fields {
        return {
            value: `${gauge.getValue()}`,
        };
    }

    /**
     * Gathers the fields for a histogram metric.
     *
     * @private
     * @param {Histogram} histogram
     * @returns {Fields}
     * @memberof CsvMetricReporter
     */
    private reportHistogram(histogram: Histogram): Fields {
        const snapshot = histogram.getSnapshot();
        const bucketFields: Fields = {};
        histogram
            .getCounts()
            .forEach((value, bucket) => bucketFields[`bucket_${bucket}`] = `${value}`);
        bucketFields["bucket_inf"] = `${this.getNumber(histogram.getCount())}`;
        return {
            ...bucketFields,
            count: `${this.getNumber(histogram.getCount())}`,
            max: `${this.getNumber(snapshot.getMax())}`,
            mean: `${this.getNumber(snapshot.getMean())}`,
            min: `${this.getNumber(snapshot.getMin())}`,
            p50: `${this.getNumber(snapshot.getMedian())}`,
            p75: `${this.getNumber(snapshot.get75thPercentile())}`,
            p95: `${this.getNumber(snapshot.get95thPercentile())}`,
            p98: `${this.getNumber(snapshot.get98thPercentile())}`,
            p99: `${this.getNumber(snapshot.get99thPercentile())}`,
            p999: `${this.getNumber(snapshot.get999thPercentile())}`,
            stddev: `${this.getNumber(snapshot.getStdDev())}`,
            sum: histogram.getSum().toString(),
        };
    }

    /**
     * Gathers the fields for a meter metric.
     *
     * @private
     * @param {Meter} meter
     * @returns {Fields}
     * @memberof CsvMetricReporter
     */
    private reportMeter(meter: Meter): Fields {
        return {
            count: `${this.getNumber(meter.getCount())}`,
            m15_rate: `${this.getNumber(meter.get15MinuteRate())}`,
            m1_rate: `${this.getNumber(meter.get1MinuteRate())}`,
            m5_rate: `${this.getNumber(meter.get5MinuteRate())}`,
            mean_rate: `${this.getNumber(meter.getMeanRate())}`,
        };
    }

    /**
     * Gathers the fields for a timer metric.
     *
     * @private
     * @param {Timer} timer
     * @returns {Fields}
     * @memberof CsvMetricReporter
     */
    private reportTimer(timer: Timer): Fields {
        const snapshot = timer.getSnapshot();
        const bucketFields: Fields = {};
        timer
            .getCounts()
            .forEach((value, bucket) => bucketFields[`bucket_${bucket}`] = `${value}`);
        bucketFields["bucket_inf"] = `${this.getNumber(timer.getCount())}`;
        return {
            ...bucketFields,
            count: `${timer.getCount() || 0}`,
            m15_rate: `${this.getNumber(timer.get15MinuteRate())}`,
            m1_rate: `${this.getNumber(timer.get1MinuteRate())}`,
            m5_rate: `${this.getNumber(timer.get5MinuteRate())}`,
            max: `${this.getNumber(snapshot.getMax())}`,
            mean: `${this.getNumber(snapshot.getMean())}`,
            mean_rate: `${this.getNumber(timer.getMeanRate())}`,
            min: `${this.getNumber(snapshot.getMin())}`,
            p50: `${this.getNumber(snapshot.getMedian())}`,
            p75: `${this.getNumber(snapshot.get75thPercentile())}`,
            p95: `${this.getNumber(snapshot.get95thPercentile())}`,
            p98: `${this.getNumber(snapshot.get98thPercentile())}`,
            p99: `${this.getNumber(snapshot.get99thPercentile())}`,
            p999: `${this.getNumber(snapshot.get999thPercentile())}`,
            stddev: `${this.getNumber(snapshot.getStdDev())}`,
            sum: timer.getSum().toString(),
        };
    }

    /**
     * Writes the rows by calling the corrsponding {@link CsvFileWriter}.
     *
     * @private
     * @template T
     * @param {T} metric
     * @param {Rows} rows
     * @param {MetricType} type
     * @memberof CsvMetricReporter
     */
    private writeRows<T extends Metric>(metric: T, rows: Rows, type: MetricType): void {
        for (const row of rows) {
            this.options.writer.writeRow(metric, row);
        }
    }

    /**
     * Combines the common tags of this reporter instance with the tags from the metric.
     *
     * @private
     * @param {Taggable} taggable
     * @returns {Tags}
     * @memberof CsvMetricReporter
     */
    private buildTags(taggable: Taggable): Tags {
        const tags: { [x: string]: string } = {};
        this.tags.forEach((tag, key) => tags[key] = tag);
        taggable.getTags().forEach((tag, key) => tags[key] = tag);
        return tags;
    }

    /**
     * Gets the value of the specified number or zero.
     *
     * @private
     * @param {number} value
     * @returns {number}
     * @memberof CsvMetricReporter
     */
    private getNumber(value: number): number {
        if (isNaN(value)) {
            return 0;
        }
        return value;
    }

}
