import "source-map-support/register";

import { Metric } from "./metric";

/**
 * Represents everything that is countable ({@link Counter}, {@link Histogram}).
 *
 * @export
 * @interface Counting
 * @extends {Metric}
 */
export interface Counting extends Metric {
    
    /**
     * Gets the current count - e.g. the number of samples in Histogram or the value of a counter.
     *
     * @returns {number}
     * @memberof Counting
     */
    getCount(): number;

}
