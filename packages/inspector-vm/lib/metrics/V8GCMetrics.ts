import "source-map-support/register";

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

export class V8GCMetrics extends BaseMetric implements MetricSet {

    private metrics: Metric[] = [];
    private minorRuns: Timer;
    private majorRuns: Timer;
    private incrementalMarkingRuns: Timer;
    private phantomCallbackProcessingRuns: Timer;
    private allRuns: Timer;

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

        const gc = GC();
        const slf = this;
        gc.on("stats", function(stats: any) {
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

        this.allRuns.setGroup(group);
        this.incrementalMarkingRuns.setGroup(group);
        this.majorRuns.setGroup(group);
        this.minorRuns.setGroup(group);
        this.phantomCallbackProcessingRuns.setGroup(group);
    }

    public setTag(name: string, value: string): void {
        this.tags.set(name, value);

        this.allRuns.setTag(name, value);
        this.incrementalMarkingRuns.setTag(name, value);
        this.majorRuns.setTag(name, value);
        this.minorRuns.setTag(name, value);
        this.phantomCallbackProcessingRuns.setTag(name, value);
    }

    public removeTag(name: string): void {
        this.tags.delete(name);

        this.allRuns.removeTag(name);
        this.incrementalMarkingRuns.removeTag(name);
        this.majorRuns.removeTag(name);
        this.minorRuns.removeTag(name);
        this.phantomCallbackProcessingRuns.removeTag(name);
    }

}
