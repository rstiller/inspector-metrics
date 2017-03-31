
import "source-map-support/register";

export interface Time {
    milliseconds: number;
    nanoseconds: number;
}

/**
 * Gets the difference in nanoseconds.
 *
 * @param one time sample
 * @param two time sample
 */
export function diff(one: Time, two: Time): number {
    if (!one || !two) {
        return 0;
    }
    const oneValue: number = one.nanoseconds + one.milliseconds * 1000000;
    const twoValue: number = two.nanoseconds + two.milliseconds * 1000000;
    return twoValue - oneValue;
}

export abstract class Clock {

    public abstract time(): Time;

}

export class StdClock extends Clock {

    public time(): Time {
        const time = {
            milliseconds: Date.now(),
            nanoseconds: 0,
        };
        return time;
    }

}
