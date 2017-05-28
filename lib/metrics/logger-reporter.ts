import "source-map-support/register";

import * as async from "async";
import * as _ from "lodash";

import { Clock, StdClock } from "./clock";
import { Counter } from "./counter";
import { Gauge } from "./gauge";
import { Histogram } from "./histogram";
import { Logger } from "./logger";
import { Meter } from "./meter";
import { MetricRegistry } from "./metric-registry";
import { MetricReporter } from "./metric-reporter";
import { Taggable } from "./taggable";
import { MILLISECOND, TimeUnit } from "./time-unit";
import { Timer } from "./timer";

export type Scheduler = (prog: () => void, interval: number) => NodeJS.Timer;

export class LoggerReporter extends MetricReporter {

    private clock: Clock;
    private timer: NodeJS.Timer;
    private interval: number;
    private unit: TimeUnit;
    private tags: Map<string, string>;
    private logMetadata: any;
    private queue: AsyncQueue<any>;
    private log: Logger;
    private scheduler: Scheduler;

    public constructor(log: Logger = console, interval: number = 1000, unit: TimeUnit = MILLISECOND,
                       tags: Map<string, string> = new Map(), clock: Clock = new StdClock(), scheduler: Scheduler = setInterval) {
        super();

        this.interval = interval;
        this.unit = unit;
        this.tags = tags;
        this.clock = clock;
        this.log = log;
        this.scheduler = scheduler;

        this.logMetadata = {
            interval,
            tags,
            unit,
        };

        this.queue = async.queue((task: (clb: () => void) => void, callback: () => void) => {
            task(callback);
        }, 1);
    }

    public getLog(): Logger {
        return this.log;
    }

    public setLog(log: Logger): void {
        this.log = log;
    }

    public start(): void {
        const interval: number = this.unit.convertTo(this.interval, MILLISECOND);
        this.timer = this.scheduler(() => {
            this.report();
        }, interval);
    }

    public stop(): void {
        if (!!this.timer) {
            this.timer.unref();
        }
    }

    private report(): void {
        if (!!this.log && !!this.metricRegistries && this.metricRegistries.length > 0) {
            this.metricRegistries.forEach((registry) => this.reportMetricRegistry(registry));
        }
    }

    private reportMetricRegistry(registry: MetricRegistry): void {
        const now: Date = new Date(this.clock.time().milliseconds);

        this.reportCounters(registry, now);
        this.reportGauges(registry, now);
        this.reportHistograms(registry, now);
        this.reportMeters(registry, now);
        this.reportTimers(registry, now);
    }

    private reportCounters(registry: MetricRegistry, date: Date): void {
        const counters = registry.getCounters();
        if (!!counters) {
            const logMetadata = _.extend({}, this.logMetadata, {
                measurement: "",
                measurement_type: "counter",
                timestamp: date,
            });
            counters.forEach((counter: Counter, name: string) => {
                if (!isNaN(counter.getCount())) {
                    logMetadata.measurement = name;
                    logMetadata.group = counter.getGroup();
                    logMetadata.tags = this.buildTags(registry, counter);
                    this.log.info(`${date} - counter ${name}: ${counter.getCount()}`, logMetadata);
                }
            });
        }
    }

    private reportGauges(registry: MetricRegistry, date: Date): void {
        const gauges = registry.getGauges();
        if (!!gauges) {
            const logMetadata = _.extend({}, this.logMetadata, {
                measurement: "",
                measurement_type: "gauge",
                timestamp: date,
            });
            gauges.forEach((gauge: Gauge<any>, name: string) => {
                if (!isNaN(gauge.getValue())) {
                    logMetadata.measurement = name;
                    logMetadata.group = gauge.getGroup();
                    logMetadata.tags = this.buildTags(registry, gauge);
                    this.log.info(`${date} - gauge ${name}: ${gauge.getValue()}`, logMetadata);
                }
            });
        }
    }

    private reportHistograms(registry: MetricRegistry, date: Date): void {
        const histograms = registry.getHistograms();
        if (!!histograms) {
            const logMetadata = _.extend({}, this.logMetadata, {
                measurement: "",
                measurement_type: "histogram",
                timestamp: date,
            });
            histograms.forEach((histogram: Histogram, name: string) => {
                if (!isNaN(histogram.getCount())) {
                    logMetadata.measurement = name;
                    logMetadata.group = histogram.getGroup();
                    logMetadata.tags = this.buildTags(registry, histogram);

                    const snapshot = histogram.getSnapshot();
                    this.log.info(`${date} - histogram ${name}\
                                    \n\tcount: ${histogram.getCount()}\
                                    \n\tmax: ${this.getNumber(snapshot.getMax())}\
                                    \n\tmean: ${this.getNumber(snapshot.getMean())}\
                                    \n\tmin: ${this.getNumber(snapshot.getMin())}\
                                    \n\tp50: ${this.getNumber(snapshot.getMedian())}\
                                    \n\tp75: ${this.getNumber(snapshot.get75thPercentile())}\
                                    \n\tp95: ${this.getNumber(snapshot.get95thPercentile())}\
                                    \n\tp98: ${this.getNumber(snapshot.get98thPercentile())}\
                                    \n\tp99: ${this.getNumber(snapshot.get99thPercentile())}\
                                    \n\tp999: ${this.getNumber(snapshot.get999thPercentile())}\
                                    \n\tstddev: ${this.getNumber(snapshot.getStdDev())}`,
                                    logMetadata);
                }
            });
        }
    }

    private reportMeters(registry: MetricRegistry, date: Date): void {
        const meters = registry.getMeters();
        if (!!meters) {
            const logMetadata = _.extend({}, this.logMetadata, {
                measurement: "",
                measurement_type: "meter",
                timestamp: date,
            });
            meters.forEach((meter: Meter, name: string) => {
                if (!isNaN(meter.getCount())) {
                    logMetadata.measurement = name;
                    logMetadata.group = meter.getGroup();
                    logMetadata.tags = this.buildTags(registry, meter);

                    this.log.info(`${date} - meter ${name}\
                                    \n\tcount: ${meter.getCount()}\
                                    \n\tm15_rate: ${this.getNumber(meter.get15MinuteRate())}\
                                    \n\tm5_rate: ${this.getNumber(meter.get5MinuteRate())}\
                                    \n\tm1_rate: ${this.getNumber(meter.get1MinuteRate())}\
                                    \n\tmean_rate: ${this.getNumber(meter.getMeanRate())}`,
                                    logMetadata);
                }
            });
        }
    }

    private reportTimers(registry: MetricRegistry, date: Date): void {
        const timers = registry.getTimers();
        if (!!timers) {
            const logMetadata = _.extend({}, this.logMetadata, {
                measurement: "",
                measurement_type: "timer",
                timestamp: date,
            });
            timers.forEach((timer: Timer, name: string) => {
                if (!isNaN(timer.getCount())) {
                    logMetadata.measurement = name;
                    logMetadata.group = timer.getGroup();
                    logMetadata.tags = this.buildTags(registry, timer);

                    const snapshot = timer.getSnapshot();
                    this.log.info(`${date} - timer ${name}\
                                    \n\tcount: ${timer.getCount()}\
                                    \n\tm15_rate: ${this.getNumber(timer.get15MinuteRate())}\
                                    \n\tm5_rate: ${this.getNumber(timer.get5MinuteRate())}\
                                    \n\tm1_rate: ${this.getNumber(timer.get1MinuteRate())}\
                                    \n\tmean_rate: ${this.getNumber(timer.getMeanRate())}\
                                    \n\tmax: ${this.getNumber(snapshot.getMax())}\
                                    \n\tmean: ${this.getNumber(snapshot.getMean())}\
                                    \n\tmin: ${this.getNumber(snapshot.getMin())}\
                                    \n\tp50: ${this.getNumber(snapshot.getMedian())}\
                                    \n\tp75: ${this.getNumber(snapshot.get75thPercentile())}\
                                    \n\tp95: ${this.getNumber(snapshot.get95thPercentile())}\
                                    \n\tp98: ${this.getNumber(snapshot.get98thPercentile())}\
                                    \n\tp99: ${this.getNumber(snapshot.get99thPercentile())}\
                                    \n\tp999: ${this.getNumber(snapshot.get999thPercentile())}\
                                    \n\tstddev: ${this.getNumber(snapshot.getStdDev())}`,
                                    logMetadata);
                }
            });
        }
    }

    private buildTags(registry: MetricRegistry, taggable: Taggable): { [key: string]: string; } {
        const tags: { [x: string]: string } = {};
        registry.getTags().forEach((tag, key) => tags[key] = tag);
        taggable.getTags().forEach((tag, key) => tags[key] = tag);
        return tags;
    }

    private getNumber(value: number): number {
        if (isNaN(value)) {
            return null;
        }
        return value;
    }

}
