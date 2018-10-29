import "source-map-support/register";

/**
 * Utility interface to track report-timestamps and -values of metric instances.
 * This is directly linked to the minimum-reporting timeout of the {@link BaseReporter},
 * which ensures that a certain value gets reported at least in a certain amount of time
 * e.g. every minute without the value having changed. And on the other hand
 * to not report / include values that haven't changed.
 *
 * An example for this is the health status of an application (a gauge: 1 means healthy, 0 means unhealthy)
 * which you normally want to report every minute for your graphs but should not
 * necessarily be included in every reporting run with the same value.
 *
 * @interface MetricEntry
 */
export interface MetricEntry {
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
