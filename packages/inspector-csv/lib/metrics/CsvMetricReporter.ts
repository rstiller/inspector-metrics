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

export type ColumnType = "date" | "name" | "field" | "group" | "description" | "value" | "tags" | "type" | "metadata";
export type Row = string[];
export type Rows = Row[];
export type Filter = (metric: Metric, key: string, value: string) => Promise<boolean>;
interface Tags {
    [key: string]: string;
}
interface Fields {
    [field: string]: string;
}

export enum ExportMode {
    ALL_IN_ONE_COLUMN,
    EACH_IN_OWN_COLUMN,
}

export interface CsvFileWriter {
    init(dir: string, file: string, header: Row): Promise<void>;
    writeRow(metric: Metric, values: Row): Promise<void>;
}

export class CsvMetricReporterOptions {

    public readonly writer: CsvFileWriter;
    public readonly interval: number;
    public readonly unit: TimeUnit;
    public readonly writeHeaders: boolean;
    public readonly useSingleQuotes: boolean;
    public readonly tagExportMode: ExportMode;
    public readonly metadataExportMode: ExportMode;
    public readonly delimiter: string;
    public readonly tagColumnPrefix: string;
    public readonly metadataColumnPrefix: string;
    public readonly columns: ColumnType[];
    public readonly encoding: string;
    public readonly filename: () => Promise<string>;
    public readonly dir: () => Promise<string>;
    public readonly tagFilter: Filter;
    public readonly metadataFilter: Filter;

    public constructor({
        writer,
        interval = 1000,
        unit = MILLISECOND,
        writeHeaders = true,
        useSingleQuotes = false,
        tagExportMode = ExportMode.ALL_IN_ONE_COLUMN,
        metadataExportMode = ExportMode.ALL_IN_ONE_COLUMN,
        delimiter = ",",
        tagColumnPrefix = "tag_",
        metadataColumnPrefix = "meta_",
        columns = [],
        encoding = "utf8",
        filename = async () => "metrics.csv",
        dir = async () => "/tmp",
        tagFilter = async () => true,
        metadataFilter = async () => true,
    }: {
        writer: CsvFileWriter,
        interval?: number,
        unit?: TimeUnit,
        writeHeaders?: boolean,
        useSingleQuotes?: boolean,
        tagExportMode?: ExportMode,
        metadataExportMode?: ExportMode,
        delimiter?: string,
        tagColumnPrefix?: string,
        metadataColumnPrefix?: string,
        columns?: ColumnType[],
        encoding?: string,
        filename?: () => Promise<string>,
        dir?: () => Promise<string>,
        tagFilter?: (metric: Metric, tag: string, value: string) => Promise<boolean>,
        metadataFilter?: (metric: Metric, key: string, value: any) => Promise<boolean>,
    }) {
        this.writer = writer;
        this.interval = interval;
        this.unit = unit;
        this.writeHeaders = writeHeaders;
        this.useSingleQuotes = useSingleQuotes;
        this.tagExportMode = tagExportMode;
        this.metadataExportMode = metadataExportMode;
        this.delimiter = delimiter;
        this.tagColumnPrefix = tagColumnPrefix;
        this.metadataColumnPrefix = metadataColumnPrefix;
        this.columns = columns;
        this.encoding = encoding;
        this.filename = filename;
        this.dir = dir;
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

    private readonly options: CsvMetricReporterOptions;
    private tags: Map<string, string> = new Map();
    private clock: Clock;
    private minReportingTimeout: number;
    private scheduler: Scheduler;
    private timer: NodeJS.Timer;
    private metricStates: Map<number, MetricEntry> = new Map();
    private header: Row;

    /**
     * Creates an instance of CsvMetricReporter.
     *
     * @param {Map<string, string>} [tags=new Map()]
     * @param {Clock} [clock=new StdClock()]
     * @param {number} [minReportingTimeout=1]
     *     timeout in minutes a metric need to be included in the report without having changed
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

    public getTags(): Map<string, string> {
        return this.tags;
    }

    public setTags(tags: Map<string, string>): void {
        this.tags = tags;
    }

    public async start(): Promise<void> {
        const interval: number = this.options.unit.convertTo(this.options.interval, MILLISECOND);
        if (this.metricRegistries && this.metricRegistries.length > 0) {
            this.header = await this.buildHeaders();
        }
        this.timer = this.scheduler(() => this.report(), interval);
    }

    public stop(): void {
        if (this.timer) {
            this.timer.unref();
        }
    }

    private async report() {
        if (this.metricRegistries && this.metricRegistries.length > 0) {
            const dir = await this.options.dir();
            const file = await this.options.filename();

            this.options.writer.init(dir, file, this.header);
            this.metricRegistries.forEach((registry) => this.reportMetricRegistry(registry));
        }
    }

    private async buildHeaders(): Promise<Row> {
        const headers: Row = [];

        for (const columnType of this.options.columns) {
            if (columnType === "metadata" && this.options.metadataExportMode === ExportMode.EACH_IN_OWN_COLUMN) {
                const metadataNames = this.getAllMetadataKeys();
                const filteredNames = await this.filterKeys(metadataNames, this.options.metadataFilter);
                filteredNames.forEach((metadataName) => {
                    headers.push(`${this.options.metadataColumnPrefix}${metadataName}`);
                });
            } else if (columnType === "tags" && this.options.tagExportMode === ExportMode.EACH_IN_OWN_COLUMN) {
                const tagNames = this.getAllTagKeys();
                const filteredTags = await this.filterKeys(tagNames, this.options.tagFilter);
                filteredTags.forEach((tag) => {
                    headers.push(`${this.options.tagColumnPrefix}${tag}`);
                });
            } else {
                headers.push(columnType);
            }
        }

        return headers;
    }

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

    private reportMetricRegistry(registry: MetricRegistry): void {
        const now: Date = new Date(this.clock.time().milliseconds);

        this.reportMetrics(registry.getMonotoneCounterList(), now, "counter",
            (counter: MonotoneCounter) => this.reportCounter(counter),
            (counter: MonotoneCounter) => counter.getCount());
        this.reportMetrics(registry.getCounterList(), now, "counter",
            (counter: Counter) => this.reportCounter(counter),
            (counter: Counter) => counter.getCount());
        this.reportMetrics(registry.getGaugeList(), now, "gauge",
            (gauge: Gauge<any>) => this.reportGauge(gauge),
            (gauge: Gauge<any>) => gauge.getValue());
        this.reportMetrics(registry.getHistogramList(), now, "histogram",
            (histogram: Histogram) => this.reportHistogram(histogram),
            (histogram: Histogram) => histogram.getCount());
        this.reportMetrics(registry.getMeterList(), now, "meter",
            (meter: Meter) => this.reportMeter(meter),
            (meter: Meter) => meter.getCount());
        this.reportMetrics(registry.getTimerList(), now, "timer",
            (timer: Timer) => this.reportTimer(timer),
            (timer: Timer) => timer.getCount());
    }

    private reportMetrics<T extends Metric>(
        metrics: T[],
        date: Date,
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
                    // TODO: build rows
                    const rows: Rows = [];
                    if (rows.length > 0) {
                        this.writeRows(metric, rows, type);
                    }
                }
            }
        });
    }

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

    private reportCounter(counter: MonotoneCounter): Fields {
        return {
            count: `${counter.getCount()}`,
        };
    }

    private reportGauge(gauge: Gauge<any>): Fields {
        return {
            value: `${gauge.getValue()}`,
        };
    }

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

    private reportMeter(meter: Meter): Fields {
        return {
            count: `${this.getNumber(meter.getCount())}`,
            m15_rate: `${this.getNumber(meter.get15MinuteRate())}`,
            m1_rate: `${this.getNumber(meter.get1MinuteRate())}`,
            m5_rate: `${this.getNumber(meter.get5MinuteRate())}`,
            mean_rate: `${this.getNumber(meter.getMeanRate())}`,
        };
    }

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

    private writeRows<T extends Metric>(metric: T, rows: Rows, type: MetricType): void {
        for (const row of rows) {
            this.options.writer.writeRow(metric, row);
        }
    }

    private buildTags(taggable: Taggable): Tags {
        const tags: { [x: string]: string } = {};
        this.tags.forEach((tag, key) => tags[key] = tag);
        taggable.getTags().forEach((tag, key) => tags[key] = tag);
        return tags;
    }

    private getNumber(value: number): number {
        if (isNaN(value)) {
            return 0;
        }
        return value;
    }

}
