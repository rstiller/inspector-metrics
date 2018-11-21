import "source-map-support/register";

/**
 * Represents a point in time.
 *
 * @export
 * @interface Time
 */
export interface Time {
    milliseconds: number;
    nanoseconds: number;
}

/**
 * Gets the time elapsed from parameter one to parameter two in nanoseconds.
 *
 * Also assumes that the first point in time is older than the second point in time.
 *
 * @export
 * @param {Time} one time sample
 * @param {Time} two time sample
 * @returns {number} a duration in nanoseconds
 */
export function diff(one: Time, two: Time): number {
    if (!one || !two) {
        return 0;
    }
    const oneValue: number = one.nanoseconds + one.milliseconds * 1000000;
    const twoValue: number = two.nanoseconds + two.milliseconds * 1000000;
    return twoValue - oneValue;
}

/**
 * Abstraction of a clock. Used to determine progress in time.
 *
 * @export
 * @abstract
 * @class Clock
 */
export abstract class Clock {

    /**
     * Gets the current point in time according to the logic of the clock implementation.
     *
     * @abstract
     * @returns {Time}
     * @memberof Clock
     */
    public abstract time(): Time;

}

/**
 * Default implementation of a Clock. Uses Date.now() as source of truth.
 *
 * @export
 * @class StdClock
 * @extends {Clock}
 */
export class StdClock extends Clock {

    /**
     * Returns a Time object whos nanoseconds component is always zero.
     *
     * @returns {Time}
     * @memberof StdClock
     */
    public time(): Time {
        const time = {
            milliseconds: Date.now(),
            nanoseconds: 0,
        };
        return time;
    }

}
