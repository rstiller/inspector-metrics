import "source-map-support/register";

import {
    BaseMetric,
    Clock,
    DefaultReservoir,
    Metric,
    MetricSet,
    NANOSECOND,
    SimpleGauge,
    Timer,
} from "inspector-metrics";

const gc = require("gc-heap-stats");

export interface MemoryStats {
    type: number;
    took: number;
    before: MemoryMetadataSnapshot;
    after: MemoryMetadataSnapshot;
    diff: MemoryMetadataSnapshot;
}

export interface MemoryMetadataSnapshot {
    total_heap_size: number;
    total_heap_size_executable: number;
    total_physical_size: number;
    total_available_size: number;
    used_heap_size: number;
    heap_size_limit: number;
    spaces: Space[];
}

export interface Space {
    space_name: string;
    space_size: number;
    space_used_size: number;
    space_available_size: number;
    physical_space_size: number;
}

export class SpaceHistory {

    public size: SimpleGauge;
    public usedSize: SimpleGauge;
    public availableSize: SimpleGauge;
    public physicalSize: SimpleGauge;

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

export class GCMetrics extends BaseMetric implements MetricSet {

    private metrics: Metric[] = [];
    private minorRuns: Timer;
    private majorRuns: Timer;
    private incrementalMarkingRuns: Timer;
    private phantomCallbackProcessingRuns: Timer;
    private allRuns: Timer;
    private spaces: Map<string, SpaceHistory> = new Map();
    private totalHeapSize: SimpleGauge = new SimpleGauge("totalHeapSize");
    private totalAvailableSize: SimpleGauge = new SimpleGauge("totalAvailableSize");
    private totalPhysicalSize: SimpleGauge = new SimpleGauge("totalPhysicalSize");
    private totalHeapExecutableSize: SimpleGauge = new SimpleGauge("totalHeapExecutableSize");
    private usedHeapSize: SimpleGauge = new SimpleGauge("usedHeapSize");
    private heapSizeLimit: SimpleGauge = new SimpleGauge("heapSizeLimit");

    public constructor(clock: Clock) {
        super();

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

        this.metrics.push(this.minorRuns);
        this.metrics.push(this.majorRuns);
        this.metrics.push(this.incrementalMarkingRuns);
        this.metrics.push(this.phantomCallbackProcessingRuns);
        this.metrics.push(this.allRuns);

        this.metrics.push(this.totalHeapSize);
        this.metrics.push(this.totalPhysicalSize);
        this.metrics.push(this.totalAvailableSize);
        this.metrics.push(this.totalHeapExecutableSize);
        this.metrics.push(this.usedHeapSize);
        this.metrics.push(this.heapSizeLimit);

        this.spaces.set("new_space", new SpaceHistory("new_space", this.metrics));
        this.spaces.set("old_space", new SpaceHistory("old_space", this.metrics));
        this.spaces.set("code_space", new SpaceHistory("code_space", this.metrics));
        this.spaces.set("map_space", new SpaceHistory("map_space", this.metrics));
        this.spaces.set("large_object_space", new SpaceHistory("large_object_space", this.metrics));

        gc().on("stats", (stats: MemoryStats) => {
            switch (stats.type) {
                case 1:
                    this.minorRuns.addDuration(stats.took * 1000000, NANOSECOND);
                    break;
                case 2:
                    this.majorRuns.addDuration(stats.took * 1000000, NANOSECOND);
                    break;
                case 4:
                    this.incrementalMarkingRuns.addDuration(stats.took * 1000000, NANOSECOND);
                    break;
                case 8:
                    this.phantomCallbackProcessingRuns.addDuration(stats.took * 1000000, NANOSECOND);
                    break;
                default:
                    this.allRuns.addDuration(stats.took * 1000000, NANOSECOND);
                    break;
            }
            this.totalHeapSize.setValue(stats.after.total_heap_size);
            this.totalPhysicalSize.setValue(stats.after.total_physical_size);
            this.totalAvailableSize.setValue(stats.after.total_available_size);
            this.totalHeapExecutableSize.setValue(stats.after.total_heap_size_executable);
            this.usedHeapSize.setValue(stats.after.used_heap_size);
            this.heapSizeLimit.setValue(stats.after.heap_size_limit);

            stats.after.spaces.forEach((space) => {
                if (this.spaces.has(space.space_name)) {
                    const history = this.spaces.get(space.space_name);
                    history.availableSize.setValue(space.space_available_size);
                    history.physicalSize.setValue(space.physical_space_size);
                    history.size.setValue(space.space_size);
                    history.usedSize.setValue(space.space_used_size);
                }
            });
        });

        this.setGroup("gc");
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

        this.minorRuns.setGroup(group);
        this.majorRuns.setGroup(group);
        this.incrementalMarkingRuns.setGroup(group);
        this.phantomCallbackProcessingRuns.setGroup(group);
        this.allRuns.setGroup(group);

        this.totalHeapSize.setGroup(group);
        this.totalAvailableSize.setGroup(group);
        this.totalPhysicalSize.setGroup(group);
        this.totalHeapExecutableSize.setGroup(group);
        this.usedHeapSize.setGroup(group);
        this.heapSizeLimit.setGroup(group);

        this.spaces.forEach((history) => {
            history.availableSize.setGroup(group);
            history.physicalSize.setGroup(group);
            history.size.setGroup(group);
            history.usedSize.setGroup(group);
        });
    }

    public setTag(name: string, value: string): void {
        this.tags.set(name, value);

        this.minorRuns.setTag(name, value);
        this.majorRuns.setTag(name, value);
        this.incrementalMarkingRuns.setTag(name, value);
        this.phantomCallbackProcessingRuns.setTag(name, value);
        this.allRuns.setTag(name, value);

        this.totalHeapSize.setTag(name, value);
        this.totalAvailableSize.setTag(name, value);
        this.totalPhysicalSize.setTag(name, value);
        this.totalHeapExecutableSize.setTag(name, value);
        this.usedHeapSize.setTag(name, value);
        this.heapSizeLimit.setTag(name, value);

        this.spaces.forEach((history) => {
            history.availableSize.setTag(name, value);
            history.physicalSize.setTag(name, value);
            history.size.setTag(name, value);
            history.usedSize.setTag(name, value);
        });
    }

    public removeTag(name: string): void {
        this.tags.delete(name);

        this.minorRuns.removeTag(name);
        this.majorRuns.removeTag(name);
        this.incrementalMarkingRuns.removeTag(name);
        this.phantomCallbackProcessingRuns.removeTag(name);
        this.allRuns.removeTag(name);

        this.totalHeapSize.removeTag(name);
        this.totalAvailableSize.removeTag(name);
        this.totalPhysicalSize.removeTag(name);
        this.totalHeapExecutableSize.removeTag(name);
        this.usedHeapSize.removeTag(name);
        this.heapSizeLimit.removeTag(name);

        this.spaces.forEach((history) => {
            history.availableSize.removeTag(name);
            history.physicalSize.removeTag(name);
            history.size.removeTag(name);
            history.usedSize.removeTag(name);
        });
    }

}
