
import "source-map-support/register";

import { BaseMetric, Metric, MetricSet } from "inspector-metrics";

export class VMMetrics extends BaseMetric implements MetricSet {

    public getMetrics(): Map<string, Metric> {
        throw new Error("Method not implemented.");
    }

}
