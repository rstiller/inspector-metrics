import "source-map-support/register";

import {
    BaseMetric,
    Metric,
    MetricSet,
    MonotoneCounter,
    Scheduler,
    SimpleGauge,
} from "inspector-metrics";

/**
 * Metric set with values related to the nodejs process.
 *
 * @export
 * @class V8ProcessMetrics
 * @extends {BaseMetric}
 * @implements {MetricSet}
 */
export class V8ProcessMetrics extends BaseMetric implements MetricSet {

    /**
     * Contains all the metrics in this metric-set.
     *
     * @private
     * @type {Metric[]}
     * @memberof V8ProcessMetrics
     */
    private metrics: Metric[] = [];
    /**
     * Tracks the active handle count.
     *
     * @private
     * @type {SimpleGauge}
     * @memberof V8ProcessMetrics
     */
    private activeHandles: SimpleGauge;
    /**
     * Tracks the active request count.
     *
     * @private
     * @type {SimpleGauge}
     * @memberof V8ProcessMetrics
     */
    private activeRequests: SimpleGauge;
    /**
     * Tracks the cpu system usage.
     *
     * @private
     * @type {MonotoneCounter}
     * @memberof V8ProcessMetrics
     */
    private cpuSystemUsage: MonotoneCounter;
    /**
     * Tracks the cpu total usage.
     *
     * @private
     * @type {MonotoneCounter}
     * @memberof V8ProcessMetrics
     */
    private cpuTotalUsage: MonotoneCounter;
    /**
     * Tracks the cpu user usage.
     *
     * @private
     * @type {MonotoneCounter}
     * @memberof V8ProcessMetrics
     */
    private cpuUserUsage: MonotoneCounter;
    /**
     * The timer reference from the scheduler.
     *
     * @private
     * @type {NodeJS.Timer}
     * @memberof V8ProcessMetrics
     */
    private timer: NodeJS.Timer;
    /**
     * Last cpu usage object.
     *
     * @private
     * @type {NodeJS.CpuUsage}
     * @memberof V8ProcessMetrics
     */
    private lastUsage: NodeJS.CpuUsage;

    /**
     * Creates an instance of V8ProcessMetrics.
     *
     * @param {string} name
     * @param {Scheduler} [scheduler=setInterval]
     * @memberof V8ProcessMetrics
     */
    public constructor(name: string, scheduler: Scheduler = setInterval) {
        super();
        this.name = name;

        this.cpuSystemUsage = new MonotoneCounter("cpu_usage", "System CPU time spent in microseconds");
        this.cpuSystemUsage.setTag("type", "system");

        this.cpuTotalUsage = new MonotoneCounter("cpu_usage", "Total user and system CPU time spent in microseconds");
        this.cpuTotalUsage.setTag("type", "total");

        this.cpuUserUsage = new MonotoneCounter("cpu_usage", "User CPU time spent in microseconds");
        this.cpuUserUsage.setTag("type", "user");

        this.activeHandles = new SimpleGauge("active_handles", "Number of active handles");
        this.activeRequests = new SimpleGauge("active_requests", "Number of active requests");

        this.metrics.push(this.activeHandles);
        this.metrics.push(this.activeRequests);
        this.metrics.push(this.cpuSystemUsage);
        this.metrics.push(this.cpuTotalUsage);
        this.metrics.push(this.cpuUserUsage);

        this.timer = scheduler(async () => this.update(), 1000);
    }

    /**
     * Stops the recording of process metrics.
     *
     * @memberof V8ProcessMetrics
     */
    public stop(): void {
        if (this.timer) {
            this.timer.unref();
        }
    }

    /**
     * Gets all metrics.
     *
     * @returns {Map<string, Metric>}
     * @memberof V8ProcessMetrics
     */
    public getMetrics(): Map<string, Metric> {
        const map: Map<string, Metric> = new Map();
        this.metrics.forEach((metric) => map.set(metric.getName(), metric));
        return map;
    }

    /**
     * Gets all metrics.
     *
     * @returns {Metric[]}
     * @memberof V8ProcessMetrics
     */
    public getMetricList(): Metric[] {
        return this.metrics;
    }

    /**
     * Sets the group of this metric-set as well as all contained metrics.
     *
     * @param {string} group
     * @returns {this}
     * @memberof V8ProcessMetrics
     */
    public setGroup(group: string): this {
        this.group = group;

        this.activeHandles.setGroup(group);
        this.activeRequests.setGroup(group);
        this.cpuSystemUsage.setGroup(group);
        this.cpuTotalUsage.setGroup(group);
        this.cpuUserUsage.setGroup(group);

        return this;
    }

    /**
     * Sets the tags of this metric-set all contained metrics accordingly.
     *
     * @param {string} name
     * @param {string} value
     * @returns {this}
     * @memberof V8ProcessMetrics
     */
    public setTag(name: string, value: string): this {
        this.tagMap.set(name, value);

        this.activeHandles.setTag(name, value);
        this.activeRequests.setTag(name, value);
        this.cpuSystemUsage.setTag(name, value);
        this.cpuTotalUsage.setTag(name, value);
        this.cpuUserUsage.setTag(name, value);

        return this;
    }

    /**
     * Removes the specified tag from this metric-set and all contained metrics accordingly.
     *
     * @param {string} name
     * @returns {this}
     * @memberof V8ProcessMetrics
     */
    public removeTag(name: string): this {
        this.tagMap.delete(name);

        this.activeHandles.removeTag(name);
        this.activeRequests.removeTag(name);
        this.cpuSystemUsage.removeTag(name);
        this.cpuTotalUsage.removeTag(name);
        this.cpuUserUsage.removeTag(name);

        return this;
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

        if (this.lastUsage) {
            const userUsageMicros = cpuUsage.user - this.lastUsage.user;
            const systemUsageMicros = cpuUsage.system - this.lastUsage.system;

            this.cpuSystemUsage.increment(systemUsageMicros);
            this.cpuTotalUsage.increment(userUsageMicros + systemUsageMicros);
            this.cpuUserUsage.increment(userUsageMicros);
        }

        this.lastUsage = cpuUsage;
    }

}
