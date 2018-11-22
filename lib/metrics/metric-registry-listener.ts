import "source-map-support/register";

import { Metric } from "./metric";

/**
 * A listener interface to keep track of metric insertion / removal.
 *
 * @export
 * @interface MetricRegistryListener
 */
export interface MetricRegistryListener {
    /**
     * Called when a metric was added to a {@link MetricRegistry}.
     *
     * @param {string} name name of the metric
     * @param {Metric} metric metric object
     * @memberof MetricRegistryListener
     */
    metricAdded(name: string, metric: Metric): void;

    /**
     * Called when a metric was removed from a {@link MetricRegistry}.
     *
     * @param {string} name
     * @param {Metric} metric
     * @memberof MetricRegistryListener
     */
    metricRemoved(name: string, metric: Metric): void;
}
