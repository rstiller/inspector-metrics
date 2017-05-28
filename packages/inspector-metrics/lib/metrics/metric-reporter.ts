import "source-map-support/register";

import { MetricRegistry } from "./metric-registry";

export abstract class MetricReporter {

    protected metricRegistries: MetricRegistry[] = [];

    public abstract start(): void;

    public abstract stop(): void;

    public addMetricRegistry(metricRegistry: MetricRegistry): void {
        this.metricRegistries.push(metricRegistry);
    }

    public removeMetricRegistry(metricRegistry: MetricRegistry): void {
        const index: number = this.metricRegistries.indexOf(metricRegistry);
        if (index > -1) {
            this.metricRegistries.splice(index, 1);
        }
    }

}
