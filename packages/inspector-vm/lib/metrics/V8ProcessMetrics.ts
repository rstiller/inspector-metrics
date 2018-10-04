import "source-map-support/register";

import {
    BaseMetric,
    Metric,
    MetricSet,
    MonotoneCounter,
    Scheduler,
    SimpleGauge,
} from "inspector-metrics";

export class V8ProcessMetrics extends BaseMetric implements MetricSet {

    private metrics: Metric[] = [];
    private activeHandles: SimpleGauge;
    private activeRequests: SimpleGauge;
    private cpuSystemUsage: MonotoneCounter;
    private cpuTotalUsage: MonotoneCounter;
    private cpuUserUsage: MonotoneCounter;
    private timer: NodeJS.Timer;
    private lastUsage: NodeJS.CpuUsage;

    public constructor(name: string, scheduler: Scheduler = setInterval) {
        super();
        this.name = name;

        this.cpuSystemUsage = new MonotoneCounter("cpu_usage", "System CPU time spent in microseconds");
        this.cpuSystemUsage.setTag("type", "system");

        this.cpuTotalUsage = new MonotoneCounter("cpu_usage", "Total user and system CPU time spent in microseconds");
        this.cpuTotalUsage.setTag("type", "total");

        this.cpuUserUsage = new MonotoneCounter("cpu_usage", "User CPU time spent in microseconds");
        this.cpuUserUsage.setTag("type", "uesr");

        this.activeHandles = new SimpleGauge("active_handles", "Number of active handles");
        this.activeRequests = new SimpleGauge("active_requests", "Number of active requests");

        this.metrics.push(this.activeHandles);
        this.metrics.push(this.activeRequests);
        this.metrics.push(this.cpuSystemUsage);
        this.metrics.push(this.cpuTotalUsage);
        this.metrics.push(this.cpuUserUsage);

        this.timer = scheduler(() => this.update(), 1000);
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

        this.activeHandles.setGroup(group);
        this.activeRequests.setGroup(group);
        this.cpuSystemUsage.setGroup(group);
        this.cpuTotalUsage.setGroup(group);
        this.cpuUserUsage.setGroup(group);
    }

    public setTag(name: string, value: string): void {
        this.tags.set(name, value);

        this.activeHandles.setTag(name, value);
        this.activeRequests.setTag(name, value);
        this.cpuSystemUsage.setTag(name, value);
        this.cpuTotalUsage.setTag(name, value);
        this.cpuUserUsage.setTag(name, value);
    }

    public removeTag(name: string): void {
        this.tags.delete(name);

        this.activeHandles.removeTag(name);
        this.activeRequests.removeTag(name);
        this.cpuSystemUsage.removeTag(name);
        this.cpuTotalUsage.removeTag(name);
        this.cpuUserUsage.removeTag(name);
    }

    private update() {
        this.updateActiveHandles();
        this.updateActiveRequests();
        this.updateCpuUsage();
    }

    private updateActiveHandles() {
        const p = process as any;
        if (typeof p._getActiveHandles === "function") {
            this.activeHandles.setValue(p._getActiveHandles().length);
        }
    }

    private updateActiveRequests() {
        const p = process as any;
        if (typeof p._getActiveRequests === "function") {
            this.activeRequests.setValue(p._getActiveRequests().length);
        }
    }

    private updateCpuUsage() {
        const cpuUsage = process.cpuUsage();
        const userUsageMicros = cpuUsage.user - this.lastUsage.user;
        const systemUsageMicros = cpuUsage.system - this.lastUsage.system;

        this.lastUsage = cpuUsage;

        this.cpuSystemUsage.increment(systemUsageMicros);
        this.cpuTotalUsage.increment(userUsageMicros + systemUsageMicros);
        this.cpuUserUsage.increment(userUsageMicros);
    }

}
