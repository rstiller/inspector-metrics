
import "source-map-support/register";

import { NANOSECOND, TimeUnit } from "./time-unit";

export interface MovingAverage {
    getAlpha(): number;
    getAverage(unit: TimeUnit): number;
    update(value: number): void;
    tick(): void;
}

export class ExponentiallyWeightedMovingAverage implements MovingAverage {

    public static ALPHA_1_MINUTE_1_SECOND_SAMPLERATE: number = 1 - Math.exp(-(1 / 60));
    public static ALPHA_1_MINUTE_5_SECOND_SAMPLERATE: number = 1 - Math.exp(-(5 / 60));
    public static ALPHA_5_MINUTE_1_SECOND_SAMPLERATE: number = 1 - Math.exp(-(1 / (60 * 5)));
    public static ALPHA_5_MINUTE_5_SECOND_SAMPLERATE: number = 1 - Math.exp(-(5 / (60 * 5)));
    public static ALPHA_15_MINUTE_1_SECOND_SAMPLERATE: number = 1 - Math.exp(-(1 / (60 * 15)));
    public static ALPHA_15_MINUTE_5_SECOND_SAMPLERATE: number = 1 - Math.exp(-(5 / (60 * 15)));

    private alpha: number;
    private interval: number;
    private sum: number = 0;
    private avg: number = -1.0;
    private timeUnitInNanoseconds: number;
    private unit: TimeUnit;

    public constructor(alpha: number, interval: number, unit: TimeUnit) {
        this.alpha = alpha;
        this.interval = interval;
        this.unit = unit;
        this.timeUnitInNanoseconds = unit.convertTo(interval, NANOSECOND);
    }

    public getAlpha(): number {
        return this.alpha;
    }

    public getUnit(): TimeUnit {
        return this.unit;
    }

    public getAverage(unit: TimeUnit): number {
        if (this.avg === -1.0) {
            return 0;
        }
        return this.avg * NANOSECOND.convertTo(this.timeUnitInNanoseconds, unit);
    }

    public update(value: number): void {
        this.sum += value;
    }

    public tick(): void {
        const sum = this.sum;
        const avg = sum / this.interval;
        this.sum -= sum;

        if (this.avg === -1.0) {
            this.avg = avg;
        } else {
            this.avg += this.alpha * (avg - this.avg);
        }
    }

}
