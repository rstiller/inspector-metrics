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

interface MetricEntry {
    lastReport: number;
    lastValue: number;
}

type MetricType = "counter" | "gauge" | "histogram" | "summary" | "untyped";

export class Percentiles {

    public static readonly METADATA_NAME = "quantiles";

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

export class Options {
    constructor(
        public includeTimestamp: boolean = false,
        public emitComments: boolean = true,
        public useUntyped: boolean = false,
    ) {}
}

/**
 * Metric reporter for prometheus.
 *
 * @see https://prometheus.io/docs/concepts/
 * @see https://prometheus.io/docs/instrumenting/exposition_formats/#text-based-format
 * @export
 * @class PrometheusMetricReporter
 * @extends {MetricReporter}
 */
export class PrometheusMetricReporter extends MetricReporter {

    private static isEmpty(value: string): boolean {
        return !value || value.trim() === "";
    }

    private static isNumber(value: any): value is number {
        return typeof(value) === "number";
    }

    private options: Options;
    private clock: Clock;
    private minReportingTimeout: number;
    private tags: Map<string, string>;
    private metricStates: Map<number, MetricEntry> = new Map();
    private counterType: MetricType = "counter";
    private gaugeType: MetricType = "gauge";
    private histogramType: MetricType = "histogram";
    private summaryType: MetricType = "summary";

    public constructor(
        options: Options = new Options(),
        tags: Map<string, string> = new Map(),
        clock: Clock = new StdClock(),
        minReportingTimeout = 1) {
        super();

        this.options = options;
        this.tags = tags;
        this.clock = clock;
        this.minReportingTimeout = MINUTE.convertTo(minReportingTimeout, MILLISECOND);

        if (options.useUntyped) {
            this.counterType = "untyped";
            this.gaugeType = "untyped";
            this.histogramType = "untyped";
            this.summaryType = "untyped";
        }
    }

    public getTags(): Map<string, string> {
        return this.tags;
    }

    public setTags(tags: Map<string, string>): void {
        this.tags = tags;
    }

    public getMetricsString(): string {
        if (this.metricRegistries && this.metricRegistries.length > 0) {
            return this.metricRegistries
                .map((registry) => this.reportMetricRegistry(registry))
                .join("") + "\n";
        }
        return "\n";
    }

    public start(): void {
    }

    public stop(): void {
    }

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

    private reportMetrics<T extends Metric>(
        metrics: T[],
        date: Date,
        reportFn: (metric: T) => string,
        lastFn: (metric: Metric) => number): string[] {

        return metrics
            .filter((metric) => !(metric as any).id || this.hasChanged((metric as any).id, lastFn(metric), date))
            .map((metric) => reportFn(metric));
    }

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
            additionalFields = this.getBuckets(metric as any, metricName, values["count"] as number, tagStr);
        } else if (metricType === "summary") {
            additionalFields = this.getQuantiles(metric as any, metricName, tagStr);
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

    private getDescription<T extends Metric>(metric: T, metricName: string): string {
        let description = metric.getDescription();
        if (PrometheusMetricReporter.isEmpty(description)) {
            description = `${metricName} description`;
        }
        return description;
    }

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

    private getTimestamp(now: Date): string {
        return this.options.includeTimestamp ? ` ${now.getUTCMilliseconds()}` : "";
    }

    private getBuckets<T extends Metric & BucketCounting>(
        metric: T,
        metricName: string,
        count: number,
        tagStr: string): string {

        const buckets: Buckets = metric.getBuckets();
        if (buckets) {
            const tagPrefix = !PrometheusMetricReporter.isEmpty(tagStr) ? ", " : "";
            const bucketStrings: string[] = [];

            metric
                .getCounts()
                .forEach((bucketCount: number, boundary: number) => {
                    bucketStrings.push(`${metricName}_bucket{${tagStr}${tagPrefix}le="${boundary}"} ${bucketCount}`);
                });

            return bucketStrings.join("\n") +
                    `\n${metricName}_bucket{${tagStr}${tagPrefix}le="+Inf"} ${count}\n`;
        }

        return "";
    }

    private getQuantiles<T extends Metric & Sampling>(
        metric: T,
        metricName: string,
        tagStr: string): string {

        const quantiles: Percentiles = metric.getMetadata(Percentiles.METADATA_NAME);
        if (quantiles) {
            const tagPrefix = !PrometheusMetricReporter.isEmpty(tagStr) ? ", " : "";
            const snapshot = metric.getSnapshot();

            return quantiles
                .boundaries
                .map((boundary) => {
                    const value = snapshot.getValue(boundary);
                    return `${metricName}{${tagStr}${tagPrefix}quantile="${boundary}"} ${value}`;
                })
                .join("\n");
        }

        return "";
    }

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

    private getMeterString(now: Date, meter: Meter): string {
        return this.getMetricString(
            now,
            meter,
            this.counterType,
            (metric) => !isNaN(meter.getCount()),
            (metric) => ({
                total: meter.getCount() || 0,
            }));
    }

    private getTimerString(now: Date, timer: Timer): string {
        return this.getMetricString(
            now,
            timer,
            this.summaryType,
            (metric) => !isNaN(timer.getCount()),
            (metric) => ({
                count: timer.getCount() || 0,
                sum: timer.getSum().toString(),
            }));
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

    private getMetricName(metric: Metric): string {
        if (metric.getGroup()) {
            return `${metric.getGroup()}:${metric.getName()}`;
        }
        return metric.getName();
    }

    private buildTags(taggable: Taggable, exclude: string[]): { [key: string]: string } {
        exclude.sort();

        const tags: { [x: string]: string } = {};
        this.tags.forEach((value, key) => {
            if (exclude.indexOf(key) === -1) {
                tags[key] = value;
            }
        });
        taggable.getTags().forEach((value, key) => {
            if (exclude.indexOf(key) === -1) {
                tags[key] = value;
            }
        });
        return tags;
    }

}
