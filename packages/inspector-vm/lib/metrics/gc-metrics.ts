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

export class GCMetrics extends BaseMetric implements MetricSet {

    private metrics: Map<string, Metric> = new Map();
    private minorRuns: Timer;
    private majorRuns: Timer;
    private incrementalMarkingRuns: Timer;
    private phantomCallbackProcessingRuns: Timer;
    private allRuns: Timer;
    private totalHeapSize: SimpleGauge = new SimpleGauge();
    private totalAvailableSize: SimpleGauge = new SimpleGauge();
    private totalPhysicalSize: SimpleGauge = new SimpleGauge();
    private totalHeapExecutableSize: SimpleGauge = new SimpleGauge();
    private usedHeapSize: SimpleGauge = new SimpleGauge();
    private heapSizeLimit: SimpleGauge = new SimpleGauge();

    public constructor(clock: Clock) {
        super();

        this.minorRuns = new Timer(clock, new DefaultReservoir(1024));
        this.minorRuns.setTag("type", "minor");

        this.majorRuns = new Timer(clock, new DefaultReservoir(1024));
        this.majorRuns.setTag("type", "major");

        this.incrementalMarkingRuns = new Timer(clock, new DefaultReservoir(1024));
        this.incrementalMarkingRuns.setTag("type", "IncrementalMarking");

        this.phantomCallbackProcessingRuns = new Timer(clock, new DefaultReservoir(1024));
        this.phantomCallbackProcessingRuns.setTag("type", "PhantomCallbackProcessing");

        this.allRuns = new Timer(clock, new DefaultReservoir(1024));
        this.allRuns.setTag("type", "all");

        this.metrics.set("minorGCRuns", this.minorRuns);
        this.metrics.set("majorGCRuns", this.majorRuns);
        this.metrics.set("incrementalMarkingRuns", this.incrementalMarkingRuns);
        this.metrics.set("phantomCallbackProcessingRuns", this.phantomCallbackProcessingRuns);
        this.metrics.set("allGCRuns", this.allRuns);
        this.metrics.set("totalHeapSize", this.totalHeapSize);
        this.metrics.set("totalPhysicalSize", this.totalPhysicalSize);
        this.metrics.set("totalAvailableSize", this.totalAvailableSize);
        this.metrics.set("totalHeapExecutableSize", this.totalHeapExecutableSize);
        this.metrics.set("usedHeapSize", this.usedHeapSize);
        this.metrics.set("heapSizeLimit", this.heapSizeLimit);

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
        });

        this.setGroup("gc");
    }

    public getMetrics(): Map<string, Metric> {
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
        this.totalHeapExecutableSize.setGroup(group);
        this.usedHeapSize.setGroup(group);
        this.heapSizeLimit.setGroup(group);
    }

    public setTag(name: string, value: string): void {
        this.tags.set(name, value);
        this.minorRuns.setTag(name, value);
        this.majorRuns.setTag(name, value);
        this.incrementalMarkingRuns.setTag(name, value);
        this.phantomCallbackProcessingRuns.setTag(name, value);
        this.allRuns.setTag(name, value);
        this.totalHeapSize.setTag(name, value);
        this.totalHeapExecutableSize.setTag(name, value);
        this.usedHeapSize.setTag(name, value);
        this.heapSizeLimit.setTag(name, value);
    }

    public removeTag(name: string): void {
        this.tags.delete(name);
        this.minorRuns.removeTag(name);
        this.majorRuns.removeTag(name);
        this.incrementalMarkingRuns.removeTag(name);
        this.phantomCallbackProcessingRuns.removeTag(name);
        this.allRuns.removeTag(name);
        this.totalHeapSize.removeTag(name);
        this.totalHeapExecutableSize.removeTag(name);
        this.usedHeapSize.removeTag(name);
        this.heapSizeLimit.removeTag(name);
    }

}
