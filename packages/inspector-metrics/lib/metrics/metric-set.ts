import "source-map-support/register";

import { Metric } from "./metric";

/**
 * Represents a collection of metric instances as a single metric.
 *
 * @export
 * @interface MetricSet
 * @extends {Metric}
 */
export interface MetricSet extends Metric {

    /**
     * Gets a mapping from names to metric instances.
     *
     * @deprecated since version 1.3 - use {@link getMetricList} instead
     * @returns {Map<string, Metric>}
     * @memberof MetricSet
     */
    getMetrics(): Map<string, Metric>;

    /**
     * Gets a list of all {@link Metric} instances.
     *
     * @returns {Metric[]}
     * @memberof MetricSet
     */
    getMetricList(): Metric[];
}
