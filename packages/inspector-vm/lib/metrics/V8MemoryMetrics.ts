import "source-map-support/register";

import {
    BaseMetric,
    Metric,
    MetricSet,
    SimpleGauge,
} from "inspector-metrics";
import * as v8 from "v8";

/**
 * A collection of {@link SimpleGauge} values for space metrics.
 *
 * @export
 * @class SpaceHistory
 */
export class SpaceHistory {

    /**
     * Total size.
     *
     * @type {SimpleGauge}
     * @memberof SpaceHistory
     */
    public size: SimpleGauge;
    /**
     * Used size.
     *
     * @type {SimpleGauge}
     * @memberof SpaceHistory
     */
    public usedSize: SimpleGauge;
    /**
     * Available size.
     *
     * @type {SimpleGauge}
     * @memberof SpaceHistory
     */
    public availableSize: SimpleGauge;
    /**
     * Physical size.
     *
     * @type {SimpleGauge}
     * @memberof SpaceHistory
     */
    public physicalSize: SimpleGauge;

    /**
     * Creates an instance of SpaceHistory.
     *
     * @param {string} spaceName
     * @param {Metric[]} metrics
     * @memberof SpaceHistory
     */
    public constructor(spaceName: string, metrics: Metric[]) {
        this.size = new SimpleGauge("spaceSize");
        this.usedSize = new SimpleGauge("spaceUsedSize");
        this.availableSize = new SimpleGauge("spaceAvailableSize");
        this.physicalSize = new SimpleGauge("spacePhysicalSize");

        this.size.setTag("space", spaceName);
        this.usedSize.setTag("space", spaceName);
        this.availableSize.setTag("space", spaceName);
        this.physicalSize.setTag("space", spaceName);

        metrics.push(this.size);
        metrics.push(this.usedSize);
        metrics.push(this.availableSize);
        metrics.push(this.physicalSize);
    }

}

/**
 * Metric set with values related to the memory nodejs uses.
 *
 * @export
 * @class V8MemoryMetrics
 * @extends {BaseMetric}
 * @implements {MetricSet}
 */
export class V8MemoryMetrics extends BaseMetric implements MetricSet {

    /**
     * Contains all the metrics in this metric-set.
     *
     * @private
     * @type {Metric[]}
     * @memberof V8MemoryMetrics
     */
    private metrics: Metric[] = [];
    /**
     * Stores the size gauges for different specs.
     *
     * @private
     * @type {Map<string, SpaceHistory>}
     * @memberof V8MemoryMetrics
     */
    private spaces: Map<string, SpaceHistory> = new Map();
    /**
     * Total heap size.
     *
     * @private
     * @type {SimpleGauge}
     * @memberof V8MemoryMetrics
     */
    private totalHeapSize: SimpleGauge = new SimpleGauge("totalHeapSize");
    /**
     * Total available size.
     *
     * @private
     * @type {SimpleGauge}
     * @memberof V8MemoryMetrics
     */
    private totalAvailableSize: SimpleGauge = new SimpleGauge("totalAvailableSize");
    /**
     * Total physical size.
     *
     * @private
     * @type {SimpleGauge}
     * @memberof V8MemoryMetrics
     */
    private totalPhysicalSize: SimpleGauge = new SimpleGauge("totalPhysicalSize");
    /**
     * Total heap size for executable code.
     *
     * @private
     * @type {SimpleGauge}
     * @memberof V8MemoryMetrics
     */
    private totalHeapSizeExecutable: SimpleGauge = new SimpleGauge("totalHeapSizeExecutable");
    /**
     * Used heap size.
     *
     * @private
     * @type {SimpleGauge}
     * @memberof V8MemoryMetrics
     */
    private usedHeapSize: SimpleGauge = new SimpleGauge("usedHeapSize");
    /**
     * Maximum heap size.
     *
     * @private
     * @type {SimpleGauge}
     * @memberof V8MemoryMetrics
     */
    private heapSizeLimit: SimpleGauge = new SimpleGauge("heapSizeLimit");
    /**
     * Allocated memory.
     *
     * @private
     * @type {SimpleGauge}
     * @memberof V8MemoryMetrics
     */
    private mallocedMemory: SimpleGauge = new SimpleGauge("mallocedMemory");
    /**
     * Maximum allocated memory.
     *
     * @private
     * @type {SimpleGauge}
     * @memberof V8MemoryMetrics
     */
    private peakMallocedMemory: SimpleGauge = new SimpleGauge("peakMallocedMemory");
    /**
     * The timer reference from the scheduler.
     *
     * @private
     * @type {NodeJS.Timer}
     * @memberof V8MemoryMetrics
     */
    private intervalRef: NodeJS.Timer;

    /**
     * Creates an instance of V8MemoryMetrics.
     *
     * @param {string} name
     * @param {number} [sampleRate=1000]
     * @memberof V8MemoryMetrics
     */
    public constructor(name: string, sampleRate = 1000) {
        super();
        this.name = name;

        this.metrics.push(this.totalHeapSize);
        this.metrics.push(this.totalPhysicalSize);
        this.metrics.push(this.totalAvailableSize);
        this.metrics.push(this.totalHeapSizeExecutable);
        this.metrics.push(this.usedHeapSize);
        this.metrics.push(this.heapSizeLimit);
        this.metrics.push(this.mallocedMemory);
        this.metrics.push(this.peakMallocedMemory);

        this.spaces.set("new_space", new SpaceHistory("new_space", this.metrics));
        this.spaces.set("old_space", new SpaceHistory("old_space", this.metrics));
        this.spaces.set("code_space", new SpaceHistory("code_space", this.metrics));
        this.spaces.set("map_space", new SpaceHistory("map_space", this.metrics));
        this.spaces.set("large_object_space", new SpaceHistory("large_object_space", this.metrics));

        this.intervalRef = global.setInterval(() => {
            const heapSpaceStatistics = v8.getHeapSpaceStatistics();
            const heapStatistics = v8.getHeapStatistics();

            this.totalHeapSize.setValue(heapStatistics.total_heap_size);
            this.totalPhysicalSize.setValue(heapStatistics.total_physical_size);
            this.totalAvailableSize.setValue(heapStatistics.total_available_size);
            this.totalHeapSizeExecutable.setValue(heapStatistics.total_heap_size_executable);
            this.usedHeapSize.setValue(heapStatistics.used_heap_size);
            this.heapSizeLimit.setValue(heapStatistics.heap_size_limit);
            this.mallocedMemory.setValue(heapStatistics.heap_size_limit);
            this.peakMallocedMemory.setValue(heapStatistics.heap_size_limit);

            heapSpaceStatistics.forEach((heapSpaceStatistic) => {
                if (this.spaces.has(heapSpaceStatistic.space_name)) {
                    const history = this.spaces.get(heapSpaceStatistic.space_name);
                    history.availableSize.setValue(heapSpaceStatistic.space_available_size);
                    history.physicalSize.setValue(heapSpaceStatistic.physical_space_size);
                    history.size.setValue(heapSpaceStatistic.space_size);
                    history.usedSize.setValue(heapSpaceStatistic.space_used_size);
                }
            });
        }, sampleRate);
    }

    /**
     * Stops the recording of memory metrics.
     *
     * @memberof V8MemoryMetrics
     */
    public stop(): void {
        this.intervalRef.unref();
    }

    /**
     * Gets all metrics.
     *
     * @returns {Map<string, Metric>}
     * @memberof V8MemoryMetrics
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
     * @memberof V8MemoryMetrics
     */
    public getMetricList(): Metric[] {
        return this.metrics;
    }

    /**
     * Sets the group of this metric-set as well as all contained metrics.
     *
     * @param {string} group
     * @returns {this}
     * @memberof V8MemoryMetrics
     */
    public setGroup(group: string): this {
        this.group = group;

        this.totalHeapSize.setGroup(group);
        this.totalAvailableSize.setGroup(group);
        this.totalPhysicalSize.setGroup(group);
        this.totalHeapSizeExecutable.setGroup(group);
        this.usedHeapSize.setGroup(group);
        this.heapSizeLimit.setGroup(group);
        this.mallocedMemory.setGroup(group);
        this.peakMallocedMemory.setGroup(group);

        this.spaces.forEach((history) => {
            history.availableSize.setGroup(group);
            history.physicalSize.setGroup(group);
            history.size.setGroup(group);
            history.usedSize.setGroup(group);
        });

        return this;
    }

    /**
     * Sets the tags of this metric-set all contained metrics accordingly.
     *
     * @param {string} name
     * @param {string} value
     * @returns {this}
     * @memberof V8MemoryMetrics
     */
    public setTag(name: string, value: string): this {
        this.tagMap.set(name, value);

        this.totalHeapSize.setTag(name, value);
        this.totalAvailableSize.setTag(name, value);
        this.totalPhysicalSize.setTag(name, value);
        this.totalHeapSizeExecutable.setTag(name, value);
        this.usedHeapSize.setTag(name, value);
        this.heapSizeLimit.setTag(name, value);
        this.mallocedMemory.setTag(name, value);
        this.peakMallocedMemory.setTag(name, value);

        this.spaces.forEach((history) => {
            history.availableSize.setTag(name, value);
            history.physicalSize.setTag(name, value);
            history.size.setTag(name, value);
            history.usedSize.setTag(name, value);
        });

        return this;
    }

    /**
     * Removes the specified tag from this metric-set and all contained metrics accordingly.
     *
     * @param {string} name
     * @memberof V8MemoryMetrics
     */
    public removeTag(name: string): this {
        this.tagMap.delete(name);

        this.totalHeapSize.removeTag(name);
        this.totalAvailableSize.removeTag(name);
        this.totalPhysicalSize.removeTag(name);
        this.totalHeapSizeExecutable.removeTag(name);
        this.usedHeapSize.removeTag(name);
        this.heapSizeLimit.removeTag(name);
        this.mallocedMemory.removeTag(name);
        this.peakMallocedMemory.removeTag(name);

        this.spaces.forEach((history) => {
            history.availableSize.removeTag(name);
            history.physicalSize.removeTag(name);
            history.size.removeTag(name);
            history.usedSize.removeTag(name);
        });

        return this;
    }

}
