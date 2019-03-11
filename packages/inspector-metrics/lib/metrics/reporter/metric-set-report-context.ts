import "source-map-support/register";

import { MetricRegistry } from "../metric-registry";
import { MetricType } from "./metric-type";
import { OverallReportContext } from "./overall-report-context";

/**
 * Helper interface for reporting runs.
 */
export interface MetricSetReportContext<M> {
    /**
     * The OverallReportContext this context is running in.
     *
     * @type {OverallReportContext}
     * @memberof ReportingContext
     */
    overallCtx: OverallReportContext;
    /**
     * The array of metric instance that is currently reported.
     *
     * @type {M[]}
     * @memberof ReportingContext
     */
    metrics: M[];
    /**
     * The registry the metric are registered in.
     *
     * @type {MetricRegistry | null}
     * @memberof ReportingContext
     */
    readonly registry: MetricRegistry | null;
    /**
     * The current date.
     *
     * @type {Date}
     * @memberof ReportingContext
     */
    readonly date: Date;
    /**
     * The type of the metrics in the {@link #metrics} array.
     *
     * @type {MetricType}
     * @memberof ReportingContext
     */
    readonly type: MetricType;
}
