import "source-map-support/register";

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
    StdClock,
    Taggable,
    Timer,
    TimeUnit,
} from "inspector-metrics";

interface MetricEntry {
    lastReport: number;
    lastValue: number;
}

export type MetricType = "counter" | "gauge" | "histogram" | "meter" | "timer";

export class CarbonMetricReporter extends MetricReporter {

    private host: string;
    private clock: Clock;
    private timer: NodeJS.Timer;
    private interval: number;
    private minReportingTimeout: number;
    private unit: TimeUnit;
    private tags: Map<string, string>;
    private logMetadata: any;
    private log: Logger = console;
    private metricStates: Map<number, MetricEntry> = new Map();
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

        this.client = graphite.createClient(this.host);
        this.timer = setInterval(() => this.report(), interval);
    }

    public stop(): void {
        this.timer.unref();
        this.client.end();
    }

    private async report() {
        this.metricRegistries.forEach((registry) => this.reportMetricRegistry(registry));
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

    private sendMetric(metric: Metric, timestamp: Date, measurement: {}) {
        const tags = this.buildTags(this.getTags(), metric);
        this.client.writeTagged(measurement, tags, timestamp, (err: any) => {
            if (err != null) {
                this.log.error(err, this.logMetadata);
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

    private buildTags(commonTags: Map<string, string>, taggable: Taggable): { [key: string]: string } {
        const tags: { [x: string]: string } = {};
        commonTags.forEach((tag, key) => tags[key] = tag);
        taggable.getTags().forEach((tag, key) => tags[key] = tag);
        return tags;
    }

    private getNumber(value: number): number {
        if (isNaN(value)) {
            return 0;
        }
        return value;
    }

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
