import "source-map-support/register";

import { Clock, diff, Time } from "./clock";
import { BucketCounting, Buckets } from "./counting";
import { Histogram } from "./histogram";
import { Int64Wrapper } from "./int64";
import { Meter } from "./meter";
import { Metered } from "./metered";
import { BaseMetric } from "./metric";
import { Reservoir } from "./reservoir";
import { Sampling } from "./sampling";
import { Snapshot } from "./snapshot";
import { Summarizing } from "./summarizing";
import { NANOSECOND, TimeUnit } from "./time-unit";

/**
 * A convenience wrapper class for a {@link Timer} to measure durations.
 *
 * @export
 * @class StopWatch
 */
export class StopWatch {

    /**
     * Used to determine a duration.
     *
     * @private
     * @type {Clock}
     * @memberof StopWatch
     */
    private clock: Clock;
    /**
     * The timer the duration is reported to.
     *
     * @private
     * @type {Timer}
     * @memberof StopWatch
     */
    private timer: Timer;
    /**
     * Gets set when the start function is invoked using the clock.
     *
     * @private
     * @type {Time}
     * @memberof StopWatch
     */
    private startTime: Time;

    /**
     * Creates an instance of StopWatch.
     *
     * @param {Clock} clock
     * @param {Timer} timer
     * @memberof StopWatch
     */
    public constructor(clock: Clock, timer: Timer) {
        this.clock = clock;
        this.timer = timer;
    }

    /**
     * Sets the startTime variable.
     *
     * @returns {this}
     * @memberof StopWatch
     */
    public start(): this {
        this.startTime = this.clock.time();
        return this;
    }

    /**
     * Adds the duration between the last invocation of the start function
     * and this invocation to the timer in nanoseconds.
     *
     * @returns {this}
     * @memberof StopWatch
     */
    public stop(): this {
        this.timer.addDuration(diff(this.startTime, this.clock.time()), NANOSECOND);
        return this;
    }

}

/**
 * A Timer is a combination of a {@link Histogram} (for the duration of an event)
 * and a {@link Meter} (for the rate of events).
 *
 * @export
 * @class Timer
 * @extends {BaseMetric}
 * @implements {Metered}
 * @implements {Sampling}
 */
export class Timer extends BaseMetric implements BucketCounting, Metered, Sampling, Summarizing {

    /**
     * Used to determine a duration.
     *
     * @private
     * @type {Clock}
     * @memberof Timer
     */
    private clock: Clock;
    /**
     * Metric to measure the event rate.
     *
     * @private
     * @type {Meter}
     * @memberof Timer
     */
    private meter: Meter;
    /**
     * Metric to measure the duration of events.
     *
     * @private
     * @type {Histogram}
     * @memberof Timer
     */
    private histogram: Histogram;

    /**
     * Creates an instance of Timer.
     *
     * @param {Clock} clock
     * @param {Reservoir} reservoir
     * @param {string} [name]
     * @param {string} [description]
     * @param {string} [buckets=new Buckets()]
     * @memberof Timer
     */
    public constructor(
        clock: Clock,
        reservoir: Reservoir,
        name?: string,
        description?: string,
        buckets: Buckets = new Buckets()) {

        super();
        this.clock = clock;
        this.name = name;
        this.description = description;
        this.meter = new Meter(clock, 1, name);
        this.histogram = new Histogram(reservoir, name, description, buckets);
    }

    /**
     * Adds a duration manually.
     *
     * @param {number} duration
     * @param {TimeUnit} unit
     * @returns {this}
     * @memberof Timer
     */
    public addDuration(duration: number, unit: TimeUnit): this {
        if (duration >= 0) {
            this.histogram.update(unit.convertTo(duration, NANOSECOND));
            this.meter.mark(1);
        }
        return this;
    }

    /**
     * Gets a snapshot from the embedded {@link Histogram}.
     *
     * @returns {Snapshot}
     * @memberof Timer
     */
    public getSnapshot(): Snapshot {
        return this.histogram.getSnapshot();
    }

    /**
     * Gets the count from the embedded {@link Histogram}.
     *
     * @returns {number}
     * @memberof Timer
     */
    public getCount(): number {
        return this.histogram.getCount();
    }

    /**
     * Gets the sum from the embedded {@link Histogram}.
     *
     * @returns {Int64Wrapper}
     * @memberof Timer
     */
    public getSum(): Int64Wrapper {
        return this.histogram.getSum();
    }

    /**
     * Gets the average rate per second of last 15 minutes.
     *
     * @returns {number}
     * @memberof Timer
     */
    public get15MinuteRate(): number {
        return this.meter.get15MinuteRate();
    }

    /**
     * Gets the average rate per second of last 5 minutes.
     *
     * @returns {number}
     * @memberof Timer
     */
    public get5MinuteRate(): number {
        return this.meter.get5MinuteRate();
    }

    /**
     * Gets the average rate per second of last minute.
     *
     * @returns {number}
     * @memberof Timer
     */
    public get1MinuteRate(): number {
        return this.meter.get1MinuteRate();
    }

    /**
     * Gets the mean rate from the embedded {@link Meter}.
     *
     * @returns {number}
     * @memberof Timer
     */
    public getMeanRate(): number {
        return this.meter.getMeanRate();
    }

    /**
     * Gets the bucket config from the internal {@link Histogram} and therefore representing the durations.
     *
     * @returns {Buckets}
     * @memberof Timer
     */
    public getBuckets(): Buckets {
        return this.histogram.getBuckets();
    }

    /**
     * Gets the bucket counts from the internal {@link Histogram}.
     *
     * @returns {Map<number, number>}
     * @memberof Timer
     */
    public getCounts(): Map<number, number> {
        return this.histogram.getCounts();
    }

    /**
     * Measures the duration of the passed function's invocation
     * synchronously and adds it to the pool.
     *
     * @template T
     * @returns {T}
     * @memberof Timer
     */
    public time<T>(f: () => T): T {
        const startTime: Time = this.clock.time();
        try {
            return f();
        } finally {
            this.addDuration(diff(startTime, this.clock.time()), NANOSECOND);
        }
    }

    /**
     * Measures the duration of the passed function's invocation
     * asynchronously and adds it to the pool.
     *
     * @template T
     * @returns {T}
     * @memberof Timer
     */
    public timeAsync<T>(f: () => Promise<T>): Promise<T> {
        const startTime: Time = this.clock.time();
        return f()
            .then((res) => {
                this.addDuration(diff(startTime, this.clock.time()), NANOSECOND);
                return res;
            })
            .catch((err) => {
                this.addDuration(diff(startTime, this.clock.time()), NANOSECOND);
                throw err;
            });
    }

    /**
     * Builds a new StopWatch.
     *
     * @returns {StopWatch}
     * @memberof Timer
     */
    public newStopWatch(): StopWatch {
        return new StopWatch(this.clock, this);
    }

}
