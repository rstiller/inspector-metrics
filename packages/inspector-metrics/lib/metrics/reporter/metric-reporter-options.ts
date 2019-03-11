import "source-map-support/register";

import { Clock } from "../clock";

/**
 * Options for the {@link MetricReporter}.
 *
 * @export
 * @interface MetricReporterOptions
 */
export interface MetricReporterOptions {
    /**
     * Clock used to determine the date for the reporting as well as the minimum-reporting timeout feature.
     *
     * @type {Clock}
     * @memberof MetricReporterOptions
     */
    readonly clock?: Clock;
    /**
     * Timeout in minutes a metric need to be included in the report without having changed.
     *
     * @type {number}
     * @memberof MetricReporterOptions
     */
    minReportingTimeout?: number;
    /**
     * Determines if a worker instance in a cluster send metrics to the master instance
     * instead of reporting the metrics directly.
     *
     * @type {boolean}
     * @memberof MetricReporterOptions
     */
    sendMetricsToMaster?: boolean;
    /**
     * Tags for this reporter instance - to be combined with the tags of each metric while reporting.
     *
     * @type {Map<string, string>}
     * @memberof MetricReporterOptions
     */
    tags?: Map<string, string>;
}
