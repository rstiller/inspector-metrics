import "source-map-support";

import { MetricReporter } from "inspector-metrics";

/**
 * Metric reporter for both prometheus and pushgateway.
 *
 * @see https://prometheus.io/docs/concepts/data_model
 * @export
 * @class PrometheusMetricReporter
 * @extends {MetricReporter}
 */
export class PrometheusMetricReporter extends MetricReporter {

    reportMetrics(): String {
        // TODO:
        return "";
    }

    start(): void {
        // TODO:
    }

    stop(): void {
        // TODO:
    }

}
