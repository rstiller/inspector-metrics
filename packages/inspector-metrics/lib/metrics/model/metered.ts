import "source-map-support/register";

import { Metric, SerializableMetric } from "./metric";

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

/**
 * Helper interface for serialized {@link Meter} metrics - represents a snapshot of the rates of a {@link Meter}.
 *
 * @export
 * @interface MeteredRates
 */
export interface MeteredRates {
    [rate: number]: number;
}

/**
 * Serializable version of a {@link Meter}.
 *
 * @export
 * @interface SerializableMetered
 * @extends {SerializableMetric}
 */
export interface SerializableMetered extends SerializableMetric {
    /**
     * Total count of events reported.
     *
     * @type {number}
     * @memberof SerializableMetered
     */
    count: number;
    /**
     * mean rate - the meaning of the mean-rate depends on the actual implementation.
     *
     * @type {number}
     * @memberof SerializableMetered
     */
    meanRate: number;
    /**
     * Mapping of time-frame to rate values - time-unit and meaning depend on the actual implementation.
     *
     * @type {MeteredRates}
     * @memberof SerializableMetered
     */
    rates: MeteredRates;
}
