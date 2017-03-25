
import "source-map-support/register";

import { Clock, diff, Time } from "./clock";
import { Metered } from "./metered";
import { ExponentiallyWeightedMovingAverage, MovingAverage } from "./moving-average";
import { Taggable } from "./taggable";
import { NANOSECOND, SECOND } from "./time-unit";

export class Meter extends Taggable implements Metered {

    private static AVG_1_MINUTE = ExponentiallyWeightedMovingAverage.ALPHA_1_MINUTE_1_SECOND_SAMPLERATE;
    private static AVG_5_MINUTE = ExponentiallyWeightedMovingAverage.ALPHA_5_MINUTE_1_SECOND_SAMPLERATE;
    private static AVG_15_MINUTE = ExponentiallyWeightedMovingAverage.ALPHA_15_MINUTE_1_SECOND_SAMPLERATE;
    private static SECOND_1_NANOS = SECOND.convertTo(1, NANOSECOND);

    private clock: Clock;
    private startTime: Time;
    private lastTime: Time;
    private count: number = 0;
    private sampleRate: number;
    private interval: number;
    private avg1Minute: MovingAverage = new ExponentiallyWeightedMovingAverage(Meter.AVG_1_MINUTE, 1, SECOND);
    private avg5Minute: MovingAverage = new ExponentiallyWeightedMovingAverage(Meter.AVG_5_MINUTE, 1, SECOND);
    private avg15Minute: MovingAverage = new ExponentiallyWeightedMovingAverage(Meter.AVG_15_MINUTE, 1, SECOND);

    public constructor(clock: Clock, sampleRate: number) {
        super();
        this.clock = clock;
        this.startTime = clock.time();
        this.lastTime = this.startTime;
        this.sampleRate = sampleRate;
        this.interval = Meter.SECOND_1_NANOS / sampleRate;
    }

    public mark(value: number): void {
        this.tickIfNeeded();
        this.count += value;
        this.avg15Minute.update(value);
        this.avg5Minute.update(value);
        this.avg1Minute.update(value);
    }

    public getCount(): number {
        return this.count;
    }

    public get15MinuteRate(): number {
        this.tickIfNeeded();
        return this.avg15Minute.getAverage(SECOND);
    }

    public get5MinuteRate(): number {
        this.tickIfNeeded();
        return this.avg5Minute.getAverage(SECOND);
    }

    public get1MinuteRate(): number {
        this.tickIfNeeded();
        return this.avg1Minute.getAverage(SECOND);
    }

    public getMeanRate(): number {
        if (this.count === 0) {
            return 0.0;
        } else {
            let elapsed: number = diff(this.startTime, this.clock.time());
            return this.count / elapsed * Meter.SECOND_1_NANOS;
        }
    }

    private tick(ticks: number): void {
        while (ticks-- > 0) {
            this.avg15Minute.tick();
            this.avg5Minute.tick();
            this.avg1Minute.tick();
        }
    }

    private tickIfNeeded(): void {
        let currentTime: Time = this.clock.time();
        let age: number = diff(this.lastTime, currentTime);
        if (age > this.interval) {
            this.lastTime = currentTime;
            this.tick(Math.floor(age / this.interval));
        }
    }

}
