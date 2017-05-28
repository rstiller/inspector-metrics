
import "source-map-support/register";

import { Clock, diff, Time } from "./clock";
import { Histogram } from "./histogram";
import { Meter } from "./meter";
import { Metered } from "./metered";
import { BaseMetric } from "./metric";
import { Reservoir } from "./reservoir";
import { Sampling } from "./sampling";
import { Snapshot } from "./snapshot";
import { NANOSECOND, TimeUnit } from "./time-unit";

export class StopWatch {

    private clock: Clock;
    private timer: Timer;
    private startTime: Time;

    public constructor(clock: Clock, timer: Timer) {
        this.clock = clock;
        this.timer = timer;
    }

    public start(): void {
        this.startTime = this.clock.time();
    }

    public stop(): void {
        this.timer.addDuration(diff(this.startTime, this.clock.time()), NANOSECOND);
    }

}

export class Timer extends BaseMetric implements Metered, Sampling {

    private clock: Clock;
    private meter: Meter;
    private histogram: Histogram;

    public constructor(clock: Clock, reservoir: Reservoir, name?: string) {
        super();
        this.clock = clock;
        this.name = name;
        this.meter = new Meter(clock, 1, name);
        this.histogram = new Histogram(reservoir, name);
    }

    public addDuration(duration: number, unit: TimeUnit): void {
        if (duration >= 0) {
            this.histogram.update(unit.convertTo(duration, NANOSECOND));
            this.meter.mark(1);
        }
    }

    public getSnapshot(): Snapshot {
        return this.histogram.getSnapshot();
    }

    public getCount(): number {
        return this.histogram.getCount();
    }

    public get15MinuteRate(): number {
        return this.meter.get15MinuteRate();
    }

    public get5MinuteRate(): number {
        return this.meter.get5MinuteRate();
    }

    public get1MinuteRate(): number {
        return this.meter.get1MinuteRate();
    }

    public getMeanRate(): number {
        return this.meter.getMeanRate();
    }

    public time(f: () => void): void {
        const startTime: Time = this.clock.time();
        try {
            f();
        } finally {
            this.addDuration(diff(startTime, this.clock.time()), NANOSECOND);
        }
    }

    public newStopWatch(): StopWatch {
        return new StopWatch(this.clock, this);
    }

}
