import "source-map-support/register";

import { Metric } from "./metric";

export interface MetricSet extends Metric {
    /**
     * @deprecated since version 1.3 - use {@link getMetricList} instead
     */
    getMetrics(): Map<string, Metric>;
    getMetricList(): Metric[];
}
