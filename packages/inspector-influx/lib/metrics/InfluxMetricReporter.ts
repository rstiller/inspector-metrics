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

export type MetricType = "counter" | "gauge" | "histogram" | "meter" | "timer";

export interface Sender {
    isReady(): Promise<boolean>;
    init(): Promise<any>;
    send(points: IPoint[]): Promise<any>;
}

interface MetricEntry {
    lastReport: number;
    lastValue: number;
}

export class InfluxMetricReporter extends MetricReporter {

    private clock: Clock;
    private timer: NodeJS.Timer;
    private interval: number;
    private minReportingTimeout: number;
    private unit: TimeUnit;
    private tags: Map<string, string>;
    private logMetadata: any;
    private queue: AsyncQueue<any>;
    private log: Logger = console;
    private sender: Sender;
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

    public getTags(): Map<string, string> {
        return this.tags;
    }

    public setTags(tags: Map<string, string>): void {
        this.tags = tags;
    }

    public getLog(): Logger {
        return this.log;
    }

    public setLog(log: Logger): void {
        this.log = log;
    }

    public start(): void {
        const interval: number = this.unit.convertTo(this.interval, MILLISECOND);
        this.timer = setInterval(() => this.report(), interval);
    }

    public stop(): void {
        this.timer.unref();
    }

    private async report() {
        const senderReady = await this.sender.isReady();
        if (senderReady && this.metricRegistries && this.metricRegistries.length > 0) {
            this.metricRegistries.forEach((registry) => this.reportMetricRegistry(registry));
        }
    }

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

    private getFieldNamePrefix(metric: Metric): string {
        if (metric.getGroup()) {
            return `${metric.getName()}.`;
        }
        return "";
    }

    private getMeasurementName(metric: Metric): string {
        if (metric.getGroup()) {
            return metric.getGroup();
        }
        return metric.getName();
    }

    private buildTags(taggable: Taggable): { [key: string]: string } {
        const tags: { [x: string]: string } = {};
        this.tags.forEach((tag, key) => tags[key] = tag);
        taggable.getTags().forEach((tag, key) => tags[key] = tag);
        return tags;
    }

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

    private getNumber(value: number): number {
        if (isNaN(value)) {
            return 0;
        }
        return value;
    }

}
