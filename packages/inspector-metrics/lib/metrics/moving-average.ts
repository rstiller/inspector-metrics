import "source-map-support/register";

import { NANOSECOND, TimeUnit } from "./time-unit";

/**
 * Represents an average value which depends on an alpha factor.
 *
 * @export
 * @interface MovingAverage
 */
export interface MovingAverage {

    /**
     * Gets the alpha value.
     *
     * @returns {number}
     * @memberof MovingAverage
     */
    getAlpha(): number;

    /**
     * Gets the average for the specified time unit -
     * e.g. 500 per second or 0.5 per millisecond or 30.000 per minute.
     *
     * @param {TimeUnit} unit
     * @returns {number}
     * @memberof MovingAverage
     */
    getAverage(unit: TimeUnit): number;

    /**
     * Adds the given value to the logic of the implementation.
     *
     * @param {number} value
     * @returns {this}
     * @memberof MovingAverage
     */
    update(value: number): this;

    /**
     * Triggers the actual average to be updated.
     * A tick represents an update event.
     *
     * @returns {this}
     * @memberof MovingAverage
     */
    tick(): this;
}

/**
 * Calculates the moving average with an exponential alpha value.
 *
 * @export
 * @class ExponentiallyWeightedMovingAverage
 * @implements {MovingAverage}
 */
export class ExponentiallyWeightedMovingAverage implements MovingAverage {

    public static ALPHA_1_MINUTE_1_SECOND_SAMPLERATE: number = 1 - Math.exp(-(1 / 60));
    public static ALPHA_1_MINUTE_5_SECOND_SAMPLERATE: number = 1 - Math.exp(-(5 / 60));
    public static ALPHA_5_MINUTE_1_SECOND_SAMPLERATE: number = 1 - Math.exp(-(1 / (60 * 5)));
    public static ALPHA_5_MINUTE_5_SECOND_SAMPLERATE: number = 1 - Math.exp(-(5 / (60 * 5)));
    public static ALPHA_15_MINUTE_1_SECOND_SAMPLERATE: number = 1 - Math.exp(-(1 / (60 * 15)));
    public static ALPHA_15_MINUTE_5_SECOND_SAMPLERATE: number = 1 - Math.exp(-(5 / (60 * 15)));

    /**
     * Alpha component (weight) of the moving average.
     *
     * @private
     * @type {number}
     * @memberof ExponentiallyWeightedMovingAverage
     */
    private alpha: number;
    /**
     * The sampling interval.
     *
     * @private
     * @type {number}
     * @memberof ExponentiallyWeightedMovingAverage
     */
    private interval: number;
    /**
     * The sum of all values passed to the update function.
     *
     * @private
     * @type {number}
     * @memberof ExponentiallyWeightedMovingAverage
     */
    private sum: number = 0;
    /**
     * The current average.
     *
     * @private
     * @type {number}
     * @memberof ExponentiallyWeightedMovingAverage
     */
    private avg: number = -1.0;
    /**
     * Multiplier of the time unit specified in the constructor in nanoseconds.
     *
     * @private
     * @type {number}
     * @memberof ExponentiallyWeightedMovingAverage
     */
    private timeUnitInNanoseconds: number;
    /**
     * The time unit of the sampling rate.
     *
     * @private
     * @type {TimeUnit}
     * @memberof ExponentiallyWeightedMovingAverage
     */
    private unit: TimeUnit;

    /**
     * Creates an instance of ExponentiallyWeightedMovingAverage.
     *
     * @param {number} alpha
     * @param {number} interval
     * @param {TimeUnit} unit
     * @memberof ExponentiallyWeightedMovingAverage
     */
    public constructor(alpha: number, interval: number, unit: TimeUnit) {
        this.alpha = alpha;
        this.interval = interval;
        this.unit = unit;
        this.timeUnitInNanoseconds = unit.convertTo(interval, NANOSECOND);
    }

    /**
     * Gets the alpha value.
     *
     * @returns {number}
     * @memberof ExponentiallyWeightedMovingAverage
     */
    public getAlpha(): number {
        return this.alpha;
    }

    /**
     * Gets the time unit.
     *
     * @returns {TimeUnit}
     * @memberof ExponentiallyWeightedMovingAverage
     */
    public getUnit(): TimeUnit {
        return this.unit;
    }

    /**
     * Gets the average in the specified time unit.
     *
     * @param {TimeUnit} unit
     * @returns {number}
     * @memberof ExponentiallyWeightedMovingAverage
     */
    public getAverage(unit: TimeUnit): number {
        if (this.avg === -1.0) {
            return 0;
        }
        return this.avg * NANOSECOND.convertTo(this.timeUnitInNanoseconds, unit);
    }

    /**
     * Adds the value to the current sum.
     *
     * @param {number} value
     * @returns {this}
     * @memberof ExponentiallyWeightedMovingAverage
     */
    public update(value: number): this {
        this.sum += value;
        return this;
    }

    /**
     * Updates the current average by multiplying the alpha value with the difference
     * of the last average and the current average.
     *
     * Averages are calculated by dividing the sum through the sampling interval.
     *
     * If the alpha value is high the last average has more weight and vice versa.
     *
     * @returns {this}
     * @memberof ExponentiallyWeightedMovingAverage
     */
    public tick(): this {
        const sum = this.sum;
        const avg = sum / this.interval;
        this.sum -= sum;

        if (this.avg === -1.0) {
            this.avg = avg;
        } else {
            this.avg += this.alpha * (avg - this.avg);
        }
        return this;
    }
}
