
import "source-map-support/register";

import { Metric, MetricSet } from "inspector-metrics";

export class VMMetrics implements MetricSet {

    public constructor() {
    }

    public getMetrics(): Map<string, Metric> {
        throw new Error("Method not implemented.");
    }

}
