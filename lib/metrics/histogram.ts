import "source-map-support/register";

import { Counting } from "./counting";
import { Int64Wrapper } from "./int64";
import { BaseMetric, Metric } from "./metric";
import { Reservoir } from "./reservoir";
import { Sampling } from "./sampling";
import { Snapshot } from "./snapshot";
import { Summarizing } from "./summarizing";

/**
 * Represents the distribution of values - e.g. number of logged-in users, search result count.
 *
 * @export
 * @class Histogram
 * @extends {BaseMetric}
 * @implements {Counting}
 * @implements {Metric}
 * @implements {Sampling}
 */
export class Histogram extends BaseMetric implements Counting, Metric, Sampling, Summarizing {

    /**
     * The value reservoir used to do sampling.
     *
     * @private
     * @type {Reservoir}
     * @memberof Histogram
     */
    private reservoir: Reservoir;
    /**
     * Continuous number representing the update operations executed.
     *
     * @private
     * @type {number}
     * @memberof Histogram
     */
    private count: number = 0;
    /**
     * Sum of all values.
     *
     * @private
     * @type {number}
     * @memberof Histogram
     */
    private sum: Int64Wrapper = new Int64Wrapper();

    /**
     * Creates an instance of Histogram.
     *
     * @param {Reservoir} reservoir the number reservoir used
     * @param {string} [name] an optional metric name
     * @param {string} [description] an optional metric description
     * @memberof Histogram
     */
    public constructor(reservoir: Reservoir, name?: string, description?: string) {
        super();
        this.reservoir = reservoir;
        this.name = name;
        this.description = description;
    }

    /**
     * Increases the current count and updates the reservoir.
     *
     * @param {number} value
     * @memberof Histogram
     */
    public update(value: number): void {
        this.count += 1;
        this.sum.add(value);
        this.reservoir.update(value);
    }

    /**
     * Gets the snapshot of the reservoir.
     *
     * @returns {Snapshot}
     * @memberof Histogram
     */
    public getSnapshot(): Snapshot {
        return this.reservoir.snapshot();
    }

    /**
     * Gets the count of update operations executed.
     *
     * @returns {number}
     * @memberof Histogram
     */
    public getCount(): number {
        return this.count;
    }

    /**
     * Gets the sum of all values.
     *
     * @returns {Int64Wrapper}
     * @memberof Histogram
     */
    public getSum(): Int64Wrapper {
        return this.sum;
    }

}
