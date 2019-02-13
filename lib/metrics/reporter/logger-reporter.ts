import "source-map-support/register";

import { StdClock } from "../clock";
import { Counter, MonotoneCounter } from "../counter";
import { Event } from "../event";
import { Gauge } from "../gauge";
import { Histogram } from "../histogram";
import { Meter } from "../meter";
import { MetricRegistry } from "../metric-registry";
import { MILLISECOND } from "../time-unit";
import { Timer } from "../timer";
import { Logger } from "./logger";
import { MetricSetReportContext, OverallReportContext, ReportingResult } from "./metric-reporter";
import { MetricType } from "./metric-type";
import { ScheduledMetricReporter, ScheduledMetricReporterOptions } from "./scheduled-reporter";

/**
 * Helper interface to abstract a log-line.
 *
 * @interface LogLine
 */
interface LogLine {
    /**
     * Message string passed to the logger instance.
     *
     * @type {string}
     * @memberof LogLine
     */
    message: string;
    /**
     * Metadata passed to the logger instance as second parameter.
     *
     * @type {*}
     * @memberof LogLine
     */
    metadata: any;
}

/**
 * Helper interface for the reporting context.
 *
 * @interface LoggerReportingContext
 * @extends {MetricSetReportContext<M>}
 * @template M
 */
interface LoggerReportingContext<M> extends MetricSetReportContext<M> {
    /**
     * Common log metadata to extend.
     *
     * @type {*}
     * @memberof LoggerReportingContext
     */
    readonly logMetadata: any;
}

/**
 * Options for {@link LoggerReporter}.
 *
 * @export
 * @class LoggerReporterOptions
 * @implements {ScheduledMetricReporterOptions}
 */
export interface LoggerReporterOptions extends ScheduledMetricReporterOptions {
    /**
     * The logger instance used to report metrics.
     *
     * @type {Logger}
     * @memberof LoggerReporterOptions
     */
    log?: Logger;
}

/**
 * Standard implementation of a {@link MetricReporter} that uses a {@link Logger} instance.
 *
 * @export
 * @class LoggerReporter
 * @extends {MetricReporter}
 */
export class LoggerReporter extends ScheduledMetricReporter<LoggerReporterOptions, LogLine> {

    /**
     * The metadata object passed to the {@link Logger} instance.
     *
     * @private
     * @type {*}
     * @memberof LoggerReporter
     */
    private logMetadata: any;

    /**
     * Creates an instance of LoggerReporter.
     *
     * @memberof LoggerReporter
     */
    public constructor({
        log = console,
        reportInterval = 1000,
        unit = MILLISECOND,
        clock = new StdClock(),
        scheduler = setInterval,
        minReportingTimeout = 1,
        tags = new Map(),
    }: LoggerReporterOptions) {
        super({
            clock,
            log,
            minReportingTimeout,
            reportInterval,
            scheduler,
            tags,
            unit,
        });
        this.logMetadata = {
            reportInterval,
            tags,
            unit,
        };
    }

    /**
     * Gets the {@link Logger} instance.
     *
     * @returns {Logger}
     * @memberof LoggerReporter
     */
    public getLog(): Logger {
        return this.options.log;
    }

    /**
     * Sets the {@link Logger} instance.
     *
     * @param {Logger} log
     * @returns {this}
     * @memberof LoggerReporter
     */
    public setLog(log: Logger): this {
        this.options.log = log;
        return this;
    }

    /**
     * Prints the specified event immediately to the logger at 'info' level.
     *
     * @template TEventData
     * @template TEvent
     * @param {TEvent} event
     * @returns {Promise<TEvent>}
     * @memberof LoggerReporter
     */
    public async reportEvent<TEventData, TEvent extends Event<TEventData>>(event: TEvent): Promise<TEvent> {
        const ctx: LoggerReportingContext<TEvent> = this
            .createMetricSetReportContext({}, null, event.getTime(), "gauge");
        const logLine: LogLine = this.reportGauge(event, ctx);
        if (logLine) {
            this.options.log.info(logLine.message, logLine.metadata);
        }
        return event;
    }

    /**
     * Creates a new {@link LoggerReportingContext} using the speicifed arguments.
     *
     * @protected
     * @param {OverallReportContext} overallCtx
     * @param {MetricRegistry} registry
     * @param {Date} date
     * @param {MetricType} type
     * @returns {LoggerReportingContext<any>}
     * @memberof LoggerReporter
     */
    protected createMetricSetReportContext(
        overallCtx: OverallReportContext,
        registry: MetricRegistry,
        date: Date,
        type: MetricType): LoggerReportingContext<any> {
        const logMetadata = Object.assign({}, this.logMetadata, {
            measurement: "",
            measurement_type: type,
            timestamp: date,
        });
        return {
            date,
            logMetadata,
            metrics: [],
            overallCtx,
            registry,
            type,
        };
    }

    /**
     * Logs each result at 'info' level using the logger instance specified in the options.
     *
     * @protected
     * @param {OverallReportContext} ctx
     * @param {MetricRegistry} registry
     * @param {Date} date
     * @param {MetricType} type
     * @param {Array<ReportingResult<any, LogLine>>} results
     * @memberof LoggerReporter
     */
    protected async handleResults(
        ctx: OverallReportContext,
        registry: MetricRegistry,
        date: Date,
        type: MetricType,
        results: Array<ReportingResult<any, LogLine>>) {
        for (const logLine of results) {
            this.options.log.info(logLine.result.message, logLine.result.metadata);
        }
    }

    /**
     * Builds the log message for the given {@link Counter} or {@link MonotoneCounter} if the value of
     * {@link Counter#getCount()} or {@link MonotoneCounter#getCount()} is a valid number.
     *
     * Reported fields:
     * - count
     *
     * Also the metadata (tags, metric group, metric name) and the date is included.
     *
     * @protected
     * @param {(MonotoneCounter | Counter)} counter
     * @param {(LoggerReportingContext<MonotoneCounter | Counter>)} ctx
     * @returns {LogLine}
     * @memberof LoggerReporter
     */
    protected reportCounter(
        counter: MonotoneCounter | Counter, ctx: LoggerReportingContext<MonotoneCounter | Counter>): LogLine {
        if (!isNaN(counter.getCount())) {
            const name = counter.getName();
            ctx.logMetadata.measurement = name;
            ctx.logMetadata.group = counter.getGroup();
            ctx.logMetadata.tags = this.buildTags(ctx.registry, counter);
            return {
                message: `${ctx.date} - counter ${name}: ${counter.getCount()}`,
                metadata: Object.assign({}, ctx.logMetadata),
            };
        }
        return null;
    }

    /**
     * Builds the log message for the given {@link Gauge} if the gauge's
     * value is a valid number.
     *
     * Reported fields:
     * - value
     *
     * Also the metadata (tags, metric group, metric name) and the date is included.
     *
     * @protected
     * @param {Gauge<any>} gauge
     * @param {LoggerReportingContext<Gauge<any>>} ctx
     * @returns {LogLine}
     * @memberof LoggerReporter
     */
    protected reportGauge(gauge: Gauge<any>, ctx: LoggerReportingContext<Gauge<any>>): LogLine {
        if (!Number.isNaN(gauge.getValue())) {
            const name = gauge.getName();
            ctx.logMetadata.measurement = name;
            ctx.logMetadata.group = gauge.getGroup();
            ctx.logMetadata.tags = this.buildTags(ctx.registry, gauge);
            return {
                message: `${ctx.date} - gauge ${name}: ${gauge.getValue()}`,
                metadata: Object.assign({}, ctx.logMetadata),
            };
        }
        return null;
    }

    /**
     * Builds the log message for the given {@link Histogram} if the value of
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
     * Also the metadata (tags, metric group, metric name) and the date is included.
     *
     * @protected
     * @param {Histogram} histogram
     * @param {LoggerReportingContext<Histogram>} ctx
     * @returns {LogLine}
     * @memberof LoggerReporter
     */
    protected reportHistogram(histogram: Histogram, ctx: LoggerReportingContext<Histogram>): LogLine {
        if (!isNaN(histogram.getCount())) {
            const name = histogram.getName();
            const snapshot = histogram.getSnapshot();

            ctx.logMetadata.measurement = name;
            ctx.logMetadata.group = histogram.getGroup();
            ctx.logMetadata.tags = this.buildTags(ctx.registry, histogram);
            return {
                message: `${ctx.date} - histogram ${name}\
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
                metadata: Object.assign({}, ctx.logMetadata),
            };
        }
        return null;
    }

    /**
     * Builds the log message for the given {@link Meter} if the value of
     * {@link Meter#getCount()} is a valid number.
     *
     * Reported fields:
     * - count
     * - m15_rate (15 min rate)
     * - m5_rate (5 min rate)
     * - m1_rate (1 min rate)
     * - mean_rate
     *
     * Also the metadata (tags, metric group, metric name) and the date is included.
     *
     * @protected
     * @param {Meter} meter
     * @param {LoggerReportingContext<Meter>} ctx
     * @returns {LogLine}
     * @memberof LoggerReporter
     */
    protected reportMeter(meter: Meter, ctx: LoggerReportingContext<Meter>): LogLine {
        if (!isNaN(meter.getCount())) {
            const name = meter.getName();

            ctx.logMetadata.measurement = name;
            ctx.logMetadata.group = meter.getGroup();
            ctx.logMetadata.tags = this.buildTags(ctx.registry, meter);
            return {
                message: `${ctx.date} - meter ${name}\
                            \n\tcount: ${meter.getCount()}\
                            \n\tm15_rate: ${this.getNumber(meter.get15MinuteRate())}\
                            \n\tm5_rate: ${this.getNumber(meter.get5MinuteRate())}\
                            \n\tm1_rate: ${this.getNumber(meter.get1MinuteRate())}\
                            \n\tmean_rate: ${this.getNumber(meter.getMeanRate())}`,
                metadata: Object.assign({}, ctx.logMetadata),
            };
        }
        return null;
    }

    /**
     * Builds the log message for the given {@link Timer} if the value of
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
     * Also the metadata (tags, metric group, metric name) and the date is included.
     *
     * @protected
     * @param {Timer} timer
     * @param {LoggerReportingContext<Timer>} ctx
     * @returns {LogLine}
     * @memberof LoggerReporter
     */
    protected reportTimer(timer: Timer, ctx: LoggerReportingContext<Timer>): LogLine {
        if (!isNaN(timer.getCount())) {
            const name = timer.getName();
            const snapshot = timer.getSnapshot();

            ctx.logMetadata.measurement = name;
            ctx.logMetadata.group = timer.getGroup();
            ctx.logMetadata.tags = this.buildTags(ctx.registry, timer);
            return {
                message: `${ctx.date} - timer ${name}\
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
                metadata: Object.assign({}, ctx.logMetadata),
            };
        }
        return null;
    }

}
