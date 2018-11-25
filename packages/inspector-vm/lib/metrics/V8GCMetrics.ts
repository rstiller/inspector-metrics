import "source-map-support/register";

import { EventEmitter } from "events";
import {
    BaseMetric,
    Clock,
    DefaultReservoir,
    Metric,
    MetricSet,
    NANOSECOND,
    Timer,
} from "inspector-metrics";

const GC = require("gc-stats");

/**
 * Metric set with values related to nodejs GC.
 *
 * @export
 * @class V8GCMetrics
 * @extends {BaseMetric}
 * @implements {MetricSet}
 */
export class V8GCMetrics extends BaseMetric implements MetricSet {

    /**
     * Contains ll the metrics in this metric-set.
     *
     * @private
     * @type {Metric[]}
     * @memberof V8GCMetrics
     */
    private metrics: Metric[] = [];
    /**
     * Timer for the gc minor runs.
     *
     * @private
     * @type {Timer}
     * @memberof V8GCMetrics
     */
    private minorRuns: Timer;
    /**
     * Timer for the gc major runs.
     *
     * @private
     * @type {Timer}
     * @memberof V8GCMetrics
     */
    private majorRuns: Timer;
    /**
     * Timer for the gc incremental marking runs.
     *
     * @private
     * @type {Timer}
     * @memberof V8GCMetrics
     */
    private incrementalMarkingRuns: Timer;
    /**
     * Timer for the gc callback processing runs.
     *
     * @private
     * @type {Timer}
     * @memberof V8GCMetrics
     */
    private phantomCallbackProcessingRuns: Timer;
    /**
     * Timer for all gc runs.
     *
     * @private
     * @type {Timer}
     * @memberof V8GCMetrics
     */
    private allRuns: Timer;
    /**
     * Garbage collection data emitter.
     *
     * @private
     * @type {EventEmitter}
     * @memberof V8GCMetrics
     */
    private gc: EventEmitter;

    /**
     * Creates an instance of V8GCMetrics.
     *
     * @param {string} name
     * @param {Clock} clock
     * @memberof V8GCMetrics
     */
    public constructor(name: string, clock: Clock) {
        super();
        this.name = name;

        this.minorRuns = new Timer(clock, new DefaultReservoir(1024), "runs");
        this.minorRuns.setTag("type", "minor");

        this.majorRuns = new Timer(clock, new DefaultReservoir(1024), "runs");
        this.majorRuns.setTag("type", "major");

        this.incrementalMarkingRuns = new Timer(clock, new DefaultReservoir(1024), "runs");
        this.incrementalMarkingRuns.setTag("type", "IncrementalMarking");

        this.phantomCallbackProcessingRuns = new Timer(clock, new DefaultReservoir(1024), "runs");
        this.phantomCallbackProcessingRuns.setTag("type", "PhantomCallbackProcessing");

        this.allRuns = new Timer(clock, new DefaultReservoir(1024), "runs");
        this.allRuns.setTag("type", "all");

        this.metrics.push(this.allRuns);
        this.metrics.push(this.incrementalMarkingRuns);
        this.metrics.push(this.majorRuns);
        this.metrics.push(this.minorRuns);
        this.metrics.push(this.phantomCallbackProcessingRuns);

        const slf = this;
        this.gc = GC();
        this.gc.on("stats", function(stats: any) {
            const duration = stats.pause;

            switch (stats.gctype) {
                case 1:
                    slf.minorRuns.addDuration(duration, NANOSECOND);
                    break;
                case 2:
                    slf.majorRuns.addDuration(duration, NANOSECOND);
                    break;
                case 4:
                    slf.incrementalMarkingRuns.addDuration(duration, NANOSECOND);
                    break;
                case 8:
                    slf.phantomCallbackProcessingRuns.addDuration(duration, NANOSECOND);
                    break;
                case 15:
                    slf.allRuns.addDuration(duration, NANOSECOND);
                    break;
            }
        });
    }

    /**
     * Stops the recording of gc metrics.
     *
     * @memberof V8GCMetrics
     */
    public stop(): void {
        this.gc.removeAllListeners();
    }

    /**
     * Gets all metrics.
     *
     * @returns {Map<string, Metric>}
     * @memberof V8GCMetrics
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
     * @memberof V8GCMetrics
     */
    public getMetricList(): Metric[] {
        return this.metrics;
    }

    /**
     * Sets the group of this metric-set as well as all contained metrics.
     *
     * @param {string} group
     * @returns {ThisType}
     * @memberof V8GCMetrics
     */
    public setGroup(group: string): this {
        this.group = group;
        this.allRuns.setGroup(group);
        this.incrementalMarkingRuns.setGroup(group);
        this.majorRuns.setGroup(group);
        this.minorRuns.setGroup(group);
        this.phantomCallbackProcessingRuns.setGroup(group);
        return this;
    }

    /**
     * Sets the tags of this metric-set all contained metrics accordingly.
     *
     * @param {string} name
     * @param {string} value
     * @returns {ThisType}
     * @memberof V8GCMetrics
     */
    public setTag(name: string, value: string): this {
        this.tags.set(name, value);
        this.allRuns.setTag(name, value);
        this.incrementalMarkingRuns.setTag(name, value);
        this.majorRuns.setTag(name, value);
        this.minorRuns.setTag(name, value);
        this.phantomCallbackProcessingRuns.setTag(name, value);
        return this;
    }

    /**
     * Removes the specified tag from this metric-set and all contained metrics accordingly.
     *
     * @param {string} name
     * @returns {ThisType}
     * @memberof V8GCMetrics
     */
    public removeTag(name: string): this {
        this.tags.delete(name);
        this.allRuns.removeTag(name);
        this.incrementalMarkingRuns.removeTag(name);
        this.majorRuns.removeTag(name);
        this.minorRuns.removeTag(name);
        this.phantomCallbackProcessingRuns.removeTag(name);
        return this;
    }

}
