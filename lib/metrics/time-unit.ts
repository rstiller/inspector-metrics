import "source-map-support/register";

/**
 * Represents a time unit like second, minute, hour.
 *
 * @export
 * @class TimeUnit
 */
export class TimeUnit {

    /**
     * The nanoseconds for one unit of this time unit.
     *
     * @private
     * @type {number}
     * @memberof TimeUnit
     */
    private nanosecondsPerUnit: number;

    /**
     * Creates an instance of TimeUnit.
     *
     * @param {number} nanosecondsPerUnit
     * @memberof TimeUnit
     */
    public constructor(nanosecondsPerUnit: number) {
        this.nanosecondsPerUnit = nanosecondsPerUnit;
    }

    /**
     * Gets the nanoseconds in one unit of this time unit.
     *
     * @returns {number}
     * @memberof TimeUnit
     */
    public getNanosecondsPerUnit(): number {
        return this.nanosecondsPerUnit;
    }

    /**
     * Converts the given value to the time unit specified.
     *
     * E.g.:
     *
     * NANOSECOND.convertTo(1000, MICROSECOND) equals 1 microsecond.
     * MICROSECOND.convertTo(1000, NANOSECOND) equals 1000000 nanoseconds.
     *
     * @param {number} value
     * @param {TimeUnit} unit
     * @returns {number}
     * @memberof TimeUnit
     */
    public convertTo(value: number, unit: TimeUnit): number {
        return (value * this.nanosecondsPerUnit) / unit.nanosecondsPerUnit;
    }

}

/**
 * One nanosecond.
 */
export const NANOSECOND = new TimeUnit(1);
/**
 * One microsecond in nanoseconds.
 */
export const MICROSECOND = new TimeUnit(1000);
/**
 * One millisecond in nanoseconds.
 */
export const MILLISECOND = new TimeUnit(1000000);
/**
 * One second in nanoseconds.
 */
export const SECOND = new TimeUnit(1000000000);
/**
 * One minute in nanoseconds.
 */
export const MINUTE = new TimeUnit(60000000000);
/**
 * One hour in nanoseconds.
 */
export const HOUR = new TimeUnit(3600000000000);
/**
 * One day in nanoseconds.
 */
export const DAY = new TimeUnit(86400000000000);
