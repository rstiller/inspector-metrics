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

        this.client = graphite.createClient(host);
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

        const measurements: Array<{}> = [];
        metrics.forEach((metric) => {
            const metricId = (metric as any).id;
            let changed = true;
            if (metricId) {
                changed = this.hasChanged(metricId, lastModifiedFunction(metric), date);
            }

            if (changed) {
                const measurement = reportFunction(metric, date);
                if (!!measurement) {
                    measurements.push(measurement);
                }
            }
        });
        if (measurements.length > 0) {
            // TODO:
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

}
