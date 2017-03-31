
import "source-map-support/register";

import * as async from "async";

import { IClusterConfig, InfluxDB, IPoint } from "influx";

import { Clock, Counter, Gauge, Histogram, Logger, Meter, Metric, MetricRegistry, MetricReporter, MILLISECOND, StdClock, Taggable, Timer, TimeUnit } from "inspector-metrics";

export type MetricType = "counter" | "gauge" | "histogram" | "meter" | "timer";

export class InfluxMetricReporter extends MetricReporter {

    private clock: Clock;
    private db: InfluxDB;
    private timer: NodeJS.Timer;
    private interval: number;
    private unit: TimeUnit;
    private tags: Map<string, string>;
    private logMetadata: any;
    private queue: AsyncQueue<any>;
    private log: Logger = console;

    public constructor(dbConfig: IClusterConfig, interval: number = 1000, unit: TimeUnit = MILLISECOND, tags: Map<string, string> = new Map(), clock: Clock = new StdClock()) {
        super();

        const database = dbConfig.database;

        this.interval = interval;
        this.unit = unit;
        this.tags = tags;
        this.clock = clock;

        this.db = new InfluxDB(dbConfig);

        this.logMetadata = {
            tags,
            interval,
            unit,
            database,
            hosts: dbConfig.hosts,
        };

        this.queue = async.queue((task: (clb: () => void) => void, callback: () => void) => {
            task(callback);
        }, 1);

        let unlock: () => void = null;
        this.queue.push((callback: () => void) => {
            unlock = callback;
        });

        this.db.getDatabaseNames().then((names: string[]) => {
            if (!names.find((value: string, index: number, arr: string[]) => value.localeCompare(database) === 0)) {
                return this.db.createDatabase(database);
            }
            return Promise.resolve(null);
        })
        .then(() => unlock());
    }

    public getLog(): Logger {
        return this.log;
    }

    public setLog(log: Logger): void {
        this.log = log;
    }

    public start(): void {
        const interval: number = this.unit.convertTo(this.interval, MILLISECOND);
        this.timer = setInterval(() => {
            this.report();
        }, interval);
    }

    public stop(): void {
        this.timer.unref();
    }

    private report(): void {
        if (!!this.db && !!this.metricRegistries && this.metricRegistries.length > 0) {
            this.metricRegistries.forEach((registry) => this.reportMetricRegistry(registry));
        }
    }

    private reportMetricRegistry(registry: MetricRegistry): void {
        const now: Date = new Date(this.clock.time().milliseconds);

        this.reportMetrics(registry.getCounters(),   now, "counter",   (name: string, counter: Counter, date: Date)     => this.reportCounter(name, counter, date));
        this.reportMetrics(registry.getGauges(),     now, "gauge",     (name: string, gauge: Gauge<any>, date: Date)    => this.reportGauge(name, gauge, date));
        this.reportMetrics(registry.getHistograms(), now, "histogram", (name: string, histogram: Histogram, date: Date) => this.reportHistogram(name, histogram, date));
        this.reportMetrics(registry.getMeters(),     now, "meter",     (name: string, meter: Meter, date: Date)         => this.reportMeter(name, meter, date));
        this.reportMetrics(registry.getTimers(),     now, "timer",     (name: string, timer: Timer, date: Date)         => this.reportTimer(name, timer, date));
    }

    private reportMetrics<T extends Metric>(metrics: Map<string, T>, date: Date, type: MetricType, reportFunction: (name: string, metric: Metric, date: Date) => IPoint): void {
        const points: IPoint[] = [];
        metrics.forEach((counter, name) => {
            const point: IPoint = reportFunction(name, counter, date);
            if (!!point) {
                points.push(point);
            }
        });
        if (points.length > 0) {
            this.sendPoints(points, type);
        }
    }

    private reportCounter(name: string, counter: Counter, date: Date): IPoint {
        if (isNaN(counter.getCount())) {
            return null;
        }
        return {
            fields: {
                value: counter.getCount(),
            },
            measurement: name,
            tags: this.buildTags(counter),
            timestamp: date,
        };
    }

    private reportGauge(name: string, gauge: Gauge<any>, date: Date): IPoint {
        if (isNaN(gauge.getValue())) {
            return null;
        }
        return {
            fields: {
                value: gauge.getValue(),
            },
            measurement: name,
            tags: this.buildTags(gauge),
            timestamp: date,
        };
    }

    private reportHistogram(name: string, histogram: Histogram, date: Date): IPoint {
        if (isNaN(histogram.getCount())) {
            return null;
        }
        const snapshot = histogram.getSnapshot();

        return {
            fields: {
                count: histogram.getCount(),
                max: this.getNumber(snapshot.getMax()),
                mean: this.getNumber(snapshot.getMean()),
                min: this.getNumber(snapshot.getMin()),
                p50: this.getNumber(snapshot.getMedian()),
                p75: this.getNumber(snapshot.get75thPercentile()),
                p95: this.getNumber(snapshot.get95thPercentile()),
                p98: this.getNumber(snapshot.get98thPercentile()),
                p99: this.getNumber(snapshot.get99thPercentile()),
                p999: this.getNumber(snapshot.get999thPercentile()),
                stddev: this.getNumber(snapshot.getStdDev()),
            },
            measurement: name,
            tags: this.buildTags(histogram),
            timestamp: date,
        };
    }

    private reportMeter(name: string, meter: Meter, date: Date): IPoint {
        if (isNaN(meter.getCount())) {
            return null;
        }
        return {
            fields: {
                count: meter.getCount(),
                m15_rate: this.getNumber(meter.get15MinuteRate()),
                m1_rate: this.getNumber(meter.get1MinuteRate()),
                m5_rate: this.getNumber(meter.get5MinuteRate()),
                mean_rate: this.getNumber(meter.getMeanRate()),
            },
            measurement: name,
            tags: this.buildTags(meter),
            timestamp: date,
        };
    }

    private reportTimer(name: string, timer: Timer, date: Date): IPoint {
        if (isNaN(timer.getCount())) {
            return null;
        }
        const snapshot = timer.getSnapshot();
        return {
            fields: {
                count: timer.getCount(),
                m15_rate: this.getNumber(timer.get15MinuteRate()),
                m1_rate: this.getNumber(timer.get1MinuteRate()),
                m5_rate: this.getNumber(timer.get5MinuteRate()),
                max: this.getNumber(snapshot.getMax()),
                mean: this.getNumber(snapshot.getMean()),
                mean_rate: this.getNumber(timer.getMeanRate()),
                min: this.getNumber(snapshot.getMin()),
                p50: this.getNumber(snapshot.getMedian()),
                p75: this.getNumber(snapshot.get75thPercentile()),
                p95: this.getNumber(snapshot.get95thPercentile()),
                p98: this.getNumber(snapshot.get98thPercentile()),
                p99: this.getNumber(snapshot.get99thPercentile()),
                p999: this.getNumber(snapshot.get999thPercentile()),
                stddev: this.getNumber(snapshot.getStdDev()),
            },
            measurement: name,
            tags: this.buildTags(timer),
            timestamp: date,
        };
    }

    private buildTags(taggable: Taggable): { [key: string]: string } {
        const tags: { [x: string]: string } = {};
        this.tags.forEach((tag, key) => tags[key] = tag);
        taggable.getTags().forEach((tag, key) => tags[key] = tag);
        return tags;
    }

    private sendPoints(points: IPoint[], type: MetricType): void {
        this.queue.push((callback: () => void) => {
            this.db.writePoints(points)
                .then(() => {
                    if (!!this.log) {
                        this.log.debug(`wrote ${type} metrics`, this.logMetadata);
                    }
                    callback();
                })
                .catch((reason) => {
                    if (!!this.log) {
                        this.log.error(`error writing ${type} metrics - reason: ${reason}`, reason, this.logMetadata);
                    }
                    callback();
                });
        });
    }

    private getNumber(value: number): number {
        if (isNaN(value)) {
            return null;
        }
        return value;
    }

}
