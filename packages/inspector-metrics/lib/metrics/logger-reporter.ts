import "source-map-support/register";

import { Clock, StdClock } from "./clock";
import { Counter } from "./counter";
import { Gauge } from "./gauge";
import { Histogram } from "./histogram";
import { Logger } from "./logger";
import { Meter } from "./meter";
import { MetricRegistry } from "./metric-registry";
import { MetricReporter } from "./metric-reporter";
import { Taggable } from "./taggable";
import { MILLISECOND, TimeUnit } from "./time-unit";
import { Timer } from "./timer";

export type Scheduler = (prog: () => void, interval: number) => NodeJS.Timer;

/**
 * Standard implementation of a {@link MetricReporter} that uses a {@link Logger} instance.
 *
 * @export
 * @class LoggerReporter
 * @extends {MetricReporter}
 */
export class LoggerReporter extends MetricReporter {

    /**
     * Clock used to display the time in a logline.
     *
     * @private
     * @type {Clock}
     * @memberof LoggerReporter
     */
    private clock: Clock;
    /**
     * Timer instance returned from the scheduler.
     *
     * @private
     * @type {NodeJS.Timer}
     * @memberof LoggerReporter
     */
    private timer: NodeJS.Timer;
    /**
     * Reporting interval.
     *
     * @private
     * @type {number}
     * @memberof LoggerReporter
     */
    private interval: number;
    /**
     * Time unit of the reporting interval.
     *
     * @private
     * @type {TimeUnit}
     * @memberof LoggerReporter
     */
    private unit: TimeUnit;
    /**
     * Tags to apply for this reporter instance.
     *
     * @private
     * @type {Map<string, string>}
     * @memberof LoggerReporter
     */
    private tags: Map<string, string>;
    /**
     * The metadata object passed to the {@link Logger} instance.
     *
     * @private
     * @type {*}
     * @memberof LoggerReporter
     */
    private logMetadata: any;
    /**
     * The {@link Logger} instance.
     *
     * @private
     * @type {Logger}
     * @memberof LoggerReporter
     */
    private log: Logger;
    /**
     * The scheduler function used to trigger a scheduling process.
     *
     * @private
     * @type {Scheduler}
     * @memberof LoggerReporter
     */
    private scheduler: Scheduler;

    /**
     * Creates an instance of LoggerReporter.
     *
     * @param {Logger} [log=console]
     * @param {number} [interval=1000]
     * @param {TimeUnit} [unit=MILLISECOND]
     * @param {Map<string, string>} [tags=new Map()]
     * @param {Clock} [clock=new StdClock()]
     * @param {Scheduler} [scheduler=setInterval]
     * @memberof LoggerReporter
     */
    public constructor(
        log: Logger = console,
        interval: number = 1000,
        unit: TimeUnit = MILLISECOND,
        tags: Map<string, string> = new Map(),
        clock: Clock = new StdClock(),
        scheduler: Scheduler = setInterval) {

        super();

        this.interval = interval;
        this.unit = unit;
        this.tags = tags;
        this.clock = clock;
        this.log = log;
        this.scheduler = scheduler;
        this.logMetadata = { interval, tags: this.tags, unit };
    }

    /**
     * Gets the {@link Logger} instance.
     *
     * @returns {Logger}
     * @memberof LoggerReporter
     */
    public getLog(): Logger {
        return this.log;
    }

    /**
     * Sets the {@link Logger} instance.
     *
     * @param {Logger} log
     * @memberof LoggerReporter
     */
    public setLog(log: Logger): void {
        this.log = log;
    }

    /**
     * Starts the scheduler with the {@link LoggerReporter#interval}.
     *
     * @memberof LoggerReporter
     */
    public start(): void {
        const interval: number = this.unit.convertTo(this.interval, MILLISECOND);
        this.timer = this.scheduler(() => this.report(), interval);
    }

    /**
     * Stops the scheduled job using the {@link LoggerReporter#timer} instance.
     *
     * @memberof LoggerReporter
     */
    public stop(): void {
        if (!!this.timer) {
            this.timer.unref();
        }
    }

    /**
     * Called periodically by the scheduled job - calls {@link LoggerReporter#reportMetricRegistry}
     * for every added {@link MetricRegistry}.
     *
     * @private
     * @memberof LoggerReporter
     */
    private report(): void {
        if (!!this.log && !!this.metricRegistries && this.metricRegistries.length > 0) {
            this.metricRegistries.forEach((registry) => this.reportMetricRegistry(registry));
        }
    }

    /**
     * Call the dedicated reporting function for the specified {@link MetricRegistry}.
     *
     * @private
     * @param {MetricRegistry} registry
     * @memberof LoggerReporter
     */
    private reportMetricRegistry(registry: MetricRegistry): void {
        const now: Date = new Date(this.clock.time().milliseconds);

        this.reportCounters(registry, now);
        this.reportGauges(registry, now);
        this.reportHistograms(registry, now);
        this.reportMeters(registry, now);
        this.reportTimers(registry, now);
    }

    /**
     * Reports the given {@link Counter} at 'info' level using the
     * {@link LoggerReporter#log} instance if the value of
     * {@link Counter#getCount()} is a valid number.
     *
     * Reported fields:
     * - count
     *
     * Also the metadata (tags, metric group, metric name) and the date gets reported.
     *
     * @private
     * @param {MetricRegistry} registry
     * @param {Date} date
     * @memberof LoggerReporter
     */
    private reportCounters(registry: MetricRegistry, date: Date): void {
        const counters = registry.getCounterList();
        if (!!counters) {
            const logMetadata = Object.assign({}, this.logMetadata, {
                measurement: "",
                measurement_type: "counter",
                timestamp: date,
            });
            counters.forEach((counter: Counter) => {
                if (!isNaN(counter.getCount())) {
                    const name = counter.getName();
                    logMetadata.measurement = name;
                    logMetadata.group = counter.getGroup();
                    logMetadata.tags = this.buildTags(registry, counter);
                    this.log.info(`${date} - counter ${name}: ${counter.getCount()}`, logMetadata);
                }
            });
        }
    }

    /**
     * Reports the given {@link Gauge} at 'info' level using the
     * {@link LoggerReporter#log} instance only if the gauge's
     * value is a valid number.
     *
     * Reported fields:
     * - value
     *
     * Also the metadata (tags, metric group, metric name) and the date gets reported.
     *
     * @private
     * @param {MetricRegistry} registry
     * @param {Date} date
     * @memberof LoggerReporter
     */
    private reportGauges(registry: MetricRegistry, date: Date): void {
        const gauges = registry.getGaugeList();
        if (!!gauges) {
            const logMetadata = Object.assign({}, this.logMetadata, {
                measurement: "",
                measurement_type: "gauge",
                timestamp: date,
            });
            gauges.forEach((gauge: Gauge<any>) => {
                if (!isNaN(gauge.getValue())) {
                    const name = gauge.getName();
                    logMetadata.measurement = name;
                    logMetadata.group = gauge.getGroup();
                    logMetadata.tags = this.buildTags(registry, gauge);
                    this.log.info(`${date} - gauge ${name}: ${gauge.getValue()}`, logMetadata);
                }
            });
        }
    }

    /**
     * Reports the given {@link Histogram} at 'info' level using the
     * {@link LoggerReporter#log} instance if the value of
     * {@link Histogram#getCount()} is a valid number.
     *
     * Reported fields:
     * - count
     * - max (max value)
     * - mean (mean value)
     * - min (min value)
     * - p50 (value of the 50% boundary)
     * - p75 (value of the 75% boundary)
     * - p95 (value of the 95% boundary)
     * - p98 (value of the 98% boundary)
     * - p99 (value of the 99% boundary)
     * - p999 (value of the 99.9% boundary)
     * - stddev (average deviation among the values)
     *
     * Also the metadata (tags, metric group, metric name) and the date gets reported.
     *
     * @private
     * @param {MetricRegistry} registry
     * @param {Date} date
     * @memberof LoggerReporter
     */
    private reportHistograms(registry: MetricRegistry, date: Date): void {
        const histograms = registry.getHistogramList();
        if (!!histograms) {
            const logMetadata = Object.assign({}, this.logMetadata, {
                measurement: "",
                measurement_type: "histogram",
                timestamp: date,
            });
            histograms.forEach((histogram: Histogram) => {
                if (!isNaN(histogram.getCount())) {
                    const name = histogram.getName();
                    logMetadata.measurement = name;
                    logMetadata.group = histogram.getGroup();
                    logMetadata.tags = this.buildTags(registry, histogram);

                    const snapshot = histogram.getSnapshot();
                    this.log.info(`${date} - histogram ${name}\
                                    \n\tcount: ${histogram.getCount()}\
                                    \n\tmax: ${this.getNumber(snapshot.getMax())}\
                                    \n\tmean: ${this.getNumber(snapshot.getMean())}\
                                    \n\tmin: ${this.getNumber(snapshot.getMin())}\
                                    \n\tp50: ${this.getNumber(snapshot.getMedian())}\
                                    \n\tp75: ${this.getNumber(snapshot.get75thPercentile())}\
                                    \n\tp95: ${this.getNumber(snapshot.get95thPercentile())}\
                                    \n\tp98: ${this.getNumber(snapshot.get98thPercentile())}\
                                    \n\tp99: ${this.getNumber(snapshot.get99thPercentile())}\
                                    \n\tp999: ${this.getNumber(snapshot.get999thPercentile())}\
                                    \n\tstddev: ${this.getNumber(snapshot.getStdDev())}`,
                                    logMetadata);
                }
            });
        }
    }

    /**
     * Reports the given {@link Meter} at 'info' level using the
     * {@link LoggerReporter#log} instance if the value of
     * {@link Meter#getCount()} is a valid number.
     *
     * Reported fields:
     * - count
     * - m15_rate (15 min rate)
     * - m5_rate (5 min rate)
     * - m1_rate (1 min rate)
     * - mean_rate
     *
     * Also the metadata (tags, metric group, metric name) and the date gets reported.
     *
     * @private
     * @param {MetricRegistry} registry
     * @param {Date} date
     * @memberof LoggerReporter
     */
    private reportMeters(registry: MetricRegistry, date: Date): void {
        const meters = registry.getMeterList();
        if (!!meters) {
            const logMetadata = Object.assign({}, this.logMetadata, {
                measurement: "",
                measurement_type: "meter",
                timestamp: date,
            });
            meters.forEach((meter: Meter) => {
                if (!isNaN(meter.getCount())) {
                    const name = meter.getName();
                    logMetadata.measurement = name;
                    logMetadata.group = meter.getGroup();
                    logMetadata.tags = this.buildTags(registry, meter);

                    this.log.info(`${date} - meter ${name}\
                                    \n\tcount: ${meter.getCount()}\
                                    \n\tm15_rate: ${this.getNumber(meter.get15MinuteRate())}\
                                    \n\tm5_rate: ${this.getNumber(meter.get5MinuteRate())}\
                                    \n\tm1_rate: ${this.getNumber(meter.get1MinuteRate())}\
                                    \n\tmean_rate: ${this.getNumber(meter.getMeanRate())}`,
                                    logMetadata);
                }
            });
        }
    }

    /**
     * Reports the given {@link Timer} at 'info' level using the
     * {@link LoggerReporter#log} instance if the value of
     * {@link Timer#getCount()} is a valid number.
     *
     * Reported fields:
     * - count
     * - max (max value)
     * - mean (mean value)
     * - min (min value)
     * - p50 (value of the 50% boundary)
     * - p75 (value of the 75% boundary)
     * - p95 (value of the 95% boundary)
     * - p98 (value of the 98% boundary)
     * - p99 (value of the 99% boundary)
     * - p999 (value of the 99.9% boundary)
     * - stddev (average deviation among the values)
     * - m15_rate (15 min rate)
     * - m5_rate (5 min rate)
     * - m1_rate (1 min rate)
     * - mean_rate
     *
     * Also the metadata (tags, metric group, metric name) and the date gets reported.
     *
     * @private
     * @param {MetricRegistry} registry
     * @param {Date} date
     * @memberof LoggerReporter
     */
    private reportTimers(registry: MetricRegistry, date: Date): void {
        const timers = registry.getTimerList();
        if (!!timers) {
            const logMetadata = Object.assign({}, this.logMetadata, {
                measurement: "",
                measurement_type: "timer",
                timestamp: date,
            });
            timers.forEach((timer: Timer) => {
                if (!isNaN(timer.getCount())) {
                    const name = timer.getName();
                    logMetadata.measurement = name;
                    logMetadata.group = timer.getGroup();
                    logMetadata.tags = this.buildTags(registry, timer);

                    const snapshot = timer.getSnapshot();
                    this.log.info(`${date} - timer ${name}\
                                    \n\tcount: ${timer.getCount()}\
                                    \n\tm15_rate: ${this.getNumber(timer.get15MinuteRate())}\
                                    \n\tm5_rate: ${this.getNumber(timer.get5MinuteRate())}\
                                    \n\tm1_rate: ${this.getNumber(timer.get1MinuteRate())}\
                                    \n\tmean_rate: ${this.getNumber(timer.getMeanRate())}\
                                    \n\tmax: ${this.getNumber(snapshot.getMax())}\
                                    \n\tmean: ${this.getNumber(snapshot.getMean())}\
                                    \n\tmin: ${this.getNumber(snapshot.getMin())}\
                                    \n\tp50: ${this.getNumber(snapshot.getMedian())}\
                                    \n\tp75: ${this.getNumber(snapshot.get75thPercentile())}\
                                    \n\tp95: ${this.getNumber(snapshot.get95thPercentile())}\
                                    \n\tp98: ${this.getNumber(snapshot.get98thPercentile())}\
                                    \n\tp99: ${this.getNumber(snapshot.get99thPercentile())}\
                                    \n\tp999: ${this.getNumber(snapshot.get999thPercentile())}\
                                    \n\tstddev: ${this.getNumber(snapshot.getStdDev())}`,
                                    logMetadata);
                }
            });
        }
    }

    /**
     * Combines the tags from the {@link MetricRegistry} and the {@link Metric}.
     *
     * @private
     * @param {MetricRegistry} registry
     * @param {Taggable} taggable
     * @returns {{ [key: string]: string; }}
     * @memberof LoggerReporter
     */
    private buildTags(registry: MetricRegistry, taggable: Taggable): { [key: string]: string; } {
        const tags: { [x: string]: string } = {};
        registry.getTags().forEach((tag, key) => tags[key] = tag);
        taggable.getTags().forEach((tag, key) => tags[key] = tag);
        return tags;
    }

    /**
     * Returns {@code null} if the value is not a number - otherwise the value.
     *
     * @private
     * @param {number} value
     * @returns {number}
     * @memberof LoggerReporter
     */
    private getNumber(value: number): number {
        if (isNaN(value)) {
            return null;
        }
        return value;
    }

}
