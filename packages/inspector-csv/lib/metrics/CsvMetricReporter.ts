import "source-map-support";

import {
    Clock,
    MetricReporter,
    StdClock,
} from "inspector-metrics";

/**
 * Utility interface to track report-timestamps and -values of metric instances.
 * This is directly linked to the minimum-reporting timeout, which ensures
 * that a certain value gets reported at least in a certain amount of time
 * e.g. every minute without the value being having changed. On the other hand
 * to not report values that haven't changed.
 *
 * @interface MetricEntry
 */
interface MetricEntry {
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

/**
 * Metric reporter for csv files.
 *
 * @export
 * @class CsvMetricReporter
 * @extends {MetricReporter}
 */
export class CsvMetricReporter extends MetricReporter {

    /**
     * Creates an instance of CsvMetricReporter.
     *
     * @param {Map<string, string>} [tags=new Map()]
     * @param {Clock} [clock=new StdClock()]
     * @param {number} [minReportingTimeout=1]
     *     timeout in minutes a metric need to be included in the report without having changed
     * @memberof CsvMetricReporter
     */
    public constructor(
        tags: Map<string, string> = new Map(),
        clock: Clock = new StdClock(),
        minReportingTimeout = 1) {
        super();
    }

    public start(): void {
    }

    public stop(): void {
    }

    public doNothing(entry: MetricEntry): string {
        return "counter";
    }

}
