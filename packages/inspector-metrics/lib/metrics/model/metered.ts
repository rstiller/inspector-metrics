import "source-map-support/register";

import { Metric } from "./metric";

/**
 * Represents a metric which measure a rate of events - e.g. function call rate or request rate.
 *
 * @export
 * @interface Metered
 * @extends {Metric}
 */
export interface Metered extends Metric {

    /**
     * Gets the total number of events.
     *
     * @returns {number}
     * @memberof Metered
     */
    getCount(): number;

    /**
     * Gets the rate of the last 15 minutes.
     *
     * @returns {number}
     * @memberof Metered
     */
    get15MinuteRate(): number;

    /**
     * Gets the rate of the last 5 minutes.
     *
     * @returns {number}
     * @memberof Metered
     */
    get5MinuteRate(): number;

    /**
     * Gets the rate of the last minute.
     *
     * @returns {number}
     * @memberof Metered
     */
    get1MinuteRate(): number;

    /**
     * Gets the mean rate - the meaning of the mean-rate depends on the actual implementation.
     *
     * @returns {number}
     * @memberof Metered
     */
    getMeanRate(): number;

}
