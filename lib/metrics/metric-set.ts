
import "source-map-support/register";

import { Metric } from "./metric";

export interface MetricSet extends Metric {
    getMetrics(): Metric[];
}
