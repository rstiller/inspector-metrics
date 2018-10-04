import "source-map-support/register";

import {
    BaseMetric,
    Metric,
    MetricSet,
    Scheduler,
    SimpleGauge,
} from "inspector-metrics";

/**
 * Metric set with values related to the nodejs event loop.
 *
 * @export
 * @class V8EventLoop
 * @extends {BaseMetric}
 * @implements {MetricSet}
 */
export class V8EventLoop extends BaseMetric implements MetricSet {

    /**
     * Contains ll the metrics in this metric-set.
     *
     * @private
     * @type {Metric[]}
     * @memberof V8EventLoop
     */
    private metrics: Metric[] = [];
    /**
     * Holds the event-loop lag in microseconds.
     *
     * @private
     * @type {SimpleGauge}
     * @memberof V8EventLoop
     */
    private eventLoopLag: SimpleGauge;
    /**
     * The timer reference from the scheduler.
     *
     * @private
     * @type {NodeJS.Timer}
     * @memberof V8EventLoop
     */
    private timer: NodeJS.Timer;

    /**
     * Creates an instance of V8EventLoop.
     *
     * @param {string} name
     * @param {Scheduler} [scheduler=setInterval]
     * @memberof V8EventLoop
     */
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

    /**
     * Stops the recording of event-loop metrics.
     *
     * @memberof V8EventLoop
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
     * @memberof V8EventLoop
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
     * @memberof V8EventLoop
     */
    public getMetricList(): Metric[] {
        return this.metrics;
    }

    /**
     * Sets the group of this metric-set as well as all contained metrics.
     *
     * @param {string} group
     * @memberof V8EventLoop
     */
    public setGroup(group: string): void {
        this.group = group;

        this.eventLoopLag.setGroup(group);
    }

    /**
     * Sets the tags of this metric-set all contained metrics accordingly.
     *
     * @param {string} name
     * @param {string} value
     * @memberof V8EventLoop
     */
    public setTag(name: string, value: string): void {
        this.tags.set(name, value);

        this.eventLoopLag.setTag(name, value);
    }

    /**
     * Removes the specified tag from this metric-set and all contained metrics accordingly.
     *
     * @param {string} name
     * @memberof V8EventLoop
     */
    public removeTag(name: string): void {
        this.tags.delete(name);

        this.eventLoopLag.removeTag(name);
    }

    /**
     * Reports the event-loop lag.
     *
     * @private
     * @param {[number, number]} start
     * @memberof V8EventLoop
     */
    private reportEventloopLag(start: [number, number]) {
        const delta = process.hrtime(start);
        const nanosec = delta[0] * 1e9 + delta[1];
        this.eventLoopLag.setValue(nanosec);
    }

}
