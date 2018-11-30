import "source-map-support/register";

import { MILLISECOND, TimeUnit } from "../time-unit";
import { MetricReporter, MetricReporterOptions } from "./metric-reporter";

/**
 * Scheduler function type definition.
 */
export type Scheduler = (prog: () => Promise<any>, interval: number) => NodeJS.Timer;

/**
 * Options for the {@link ScheduledMetricReporter}.
 *
 * @export
 * @interface ScheduledMetricReporterOptions
 * @extends {MetricReporterOptions}
 */
export interface ScheduledMetricReporterOptions extends MetricReporterOptions {
    /**
     * The reporting interval in the time-unit specified in {@link #unit}.
     *
     * @type {number}
     * @memberof ScheduledMetricReporterOptions
     */
    readonly reportInterval?: number;
    /**
     * Time unit for the reporting interval.
     *
     * @type {TimeUnit}
     * @memberof ScheduledMetricReporterOptions
     */
    readonly unit?: TimeUnit;
    /**
     * The scheduler function used to trigger reporting runs.
     *
     * @type {Scheduler}
     * @memberof ScheduledMetricReporterOptions
     */
    readonly scheduler?: Scheduler;
}

/**
 * Base-class for scheduled metric-reporter implementations.
 *
 * @export
 * @abstract
 * @class ScheduledMetricReporter
 */
export abstract class ScheduledMetricReporter<O extends ScheduledMetricReporterOptions, T>
    extends MetricReporter<O, T> {

    /**
     * Timer instance retuned by the scheduler function.
     *
     * @private
     * @type {NodeJS.Timer}
     * @memberof ScheduledMetricReporter
     */
    private timer: NodeJS.Timer;

    /**
     * Creates an instance of ScheduledMetricReporter.
     *
     * @param {O} options
     * @memberof ScheduledMetricReporter
     */
    public constructor(options: O) {
        super(options);
    }

    /**
     * Uses the scheduler function to call the {@link #report} function
     * in the interval specified. The interval is converted into {@link MILLISECOND}s.
     *
     * @returns {Promise<this>}
     * @memberof ScheduledMetricReporter
     */
    public async start(): Promise<this> {
        const interval: number = this.options.unit.convertTo(this.options.reportInterval, MILLISECOND);
        this.timer = this.options.scheduler(() => this.report(), interval);
        return this;
    }

    /**
     * Stops reporting metrics.
     *
     * @returns {Promise<this>}
     * @memberof ScheduledMetricReporter
     */
    public async stop(): Promise<this> {
        if (this.timer) {
            this.timer.unref();
        }
        return this;
    }
}
