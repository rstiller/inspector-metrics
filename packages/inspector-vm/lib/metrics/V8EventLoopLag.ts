import "source-map-support/register";

import {
    BaseMetric,
    Metric,
    MetricSet,
    Scheduler,
    SimpleGauge,
} from "inspector-metrics";

export class V8EventLoopLag extends BaseMetric implements MetricSet {

    private metrics: Metric[] = [];
    private eventLoopLag: SimpleGauge;
    private timer: NodeJS.Timer;

    public constructor(name: string, scheduler: Scheduler = setInterval) {
        super();
        this.name = name;

        this.eventLoopLag = new SimpleGauge(
            "lag",
            "measures the duration between committing a function to the event loop and the function being executed",
        );

        this.metrics.push(this.eventLoopLag);
        this.timer = scheduler(() => {
            setImmediate((start) => this.reportEventloopLag(start), process.hrtime());
        }, 500);
    }

    public stop(): void {
        if (this.timer) {
            this.timer.unref();
        }
    }

    public getMetrics(): Map<string, Metric> {
        const map: Map<string, Metric> = new Map();
        this.metrics.forEach((metric) => map.set(metric.getName(), metric));
        return map;
    }

    public getMetricList(): Metric[] {
        return this.metrics;
    }

    public setGroup(group: string): void {
        this.group = group;

        this.eventLoopLag.setGroup(group);
    }

    public setTag(name: string, value: string): void {
        this.tags.set(name, value);

        this.eventLoopLag.setTag(name, value);
    }

    public removeTag(name: string): void {
        this.tags.delete(name);

        this.eventLoopLag.removeTag(name);
    }

    private reportEventloopLag(start: [number, number]) {
        const delta = process.hrtime(start);
        const nanosec = delta[0] * 1e9 + delta[1];
        this.eventLoopLag.setValue(nanosec);
    }

}
