import "source-map-support/register";

import * as cluster from "cluster";

import { MILLISECOND, TimeUnit } from "../model/time-unit";
import { MetricReporter } from "./metric-reporter";
import { MetricReporterOptions } from "./metric-reporter-options";
import { ReportMessageReceiver } from "./report-message-receiver";

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
     * Timer instance returned by the scheduler function.
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
     * @param {string} [reporterType] the type of the reporter implementation - for internal use
     * @param {ReportMessageReceiver} [eventReceiver=cluster]
     * @memberof ScheduledMetricReporter
     */
    public constructor(options: O, reporterType?: string, eventReceiver: ReportMessageReceiver = cluster) {
        super(options, reporterType, eventReceiver);
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
        this.timer = this.options.scheduler(async () => this.report(), interval);
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
