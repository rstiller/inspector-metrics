import "source-map-support";

import { MetricReporterOptions } from "inspector-metrics";
import { PrometheusClusterOptions } from "./PrometheusClusterOptions";

/**
 * Configuration object for {@link PrometheusMetricReporter}.
 *
 * @export
 * @interface PrometheusReporterOptions
 */
export interface PrometheusReporterOptions extends MetricReporterOptions {
    /**
     * indicates if UTC converted timestamps should be appended to each metric data
     *
     * @type {boolean}
     * @memberof PrometheusReporterOptions
     */
    readonly includeTimestamp?: boolean;
    /**
     * indicates if comments like HELP and TYPE should be emitted
     *
     * @type {boolean}
     * @memberof PrometheusReporterOptions
     */
    readonly emitComments?: boolean;
    /**
     * indicates if the untyped should always be used
     *
     * @type {boolean}
     * @memberof PrometheusReporterOptions
     */
    readonly useUntyped?: boolean;
    /**
     * Options for clustering support.
     *
     * @type {PrometheusClusterOptions<any>}
     * @memberof MetricReporterOptions
     */
    clusterOptions?: PrometheusClusterOptions<any>;
}
