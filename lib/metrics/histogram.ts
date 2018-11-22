import "source-map-support/register";

import { BucketCounting, Buckets, Counting } from "./counting";
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
export class Histogram extends BaseMetric implements BucketCounting, Counting, Metric, Sampling, Summarizing {

    /**
     * The value reservoir used to do sampling.
     *
     * @private
     * @type {Reservoir}
     * @memberof Histogram
     */
    protected readonly reservoir: Reservoir;
    /**
     * Continuous number representing the update operations executed.
     *
     * @private
     * @type {number}
     * @memberof Histogram
     */
    protected count: number = 0;
    /**
     * Sum of all values.
     *
     * @private
     * @type {number}
     * @memberof Histogram
     */
    protected sum: Int64Wrapper = new Int64Wrapper();
    /**
     * Contains all countings based on {@link Histogram#buckets}.
     *
     * @private
     * @type {{ [boundary: number]: number }}
     * @memberof Histogram
     */
    protected readonly bucketCounts: Map<number, number> = new Map();
    /**
     * The bucket config used to count.
     *
     * @private
     * @type {Buckets}
     * @memberof Histogram
     */
    protected readonly buckets: Buckets;

    /**
     * Creates an instance of Histogram.
     *
     * @param {Reservoir} reservoir the number reservoir used
     * @param {string} [name] an optional metric name
     * @param {string} [description] an optional metric description
     * @memberof Histogram
     */
    public constructor(reservoir: Reservoir, name?: string, description?: string, buckets: Buckets = new Buckets()) {
        super();
        this.reservoir = reservoir;
        this.name = name;
        this.description = description;
        this.buckets = buckets;
        for (const boundary of this.buckets.boundaries) {
            this.bucketCounts.set(boundary, 0);
        }
    }

    /**
     * Increases the total count, updates the reservoir,
     * updates the bucket counts and adds the specified value
     * to the overall sum.
     *
     * The bucket boundaries from {@link Buckets#boundaries} represent the upper edge
     * of a value range. Each value that is below a boundary is increasing the
     * according bucket count. E.g. assume the bucket config [10, 20, 30]:
     *
     * the value 11 is increasing buckets 20 and 30
     *
     * the value -9 is increasing all buckets (10, 20 and 30)
     *
     * the value 31 is increasing none of the buckets
     *
     * @param {number} value
     * @returns {this}
     * @memberof Histogram
     */
    public update(value: number): this {
        this.count++;
        this.sum.add(value);
        for (const boundary of this.buckets.boundaries) {
            if (value < boundary) {
                this.bucketCounts.set(boundary, this.bucketCounts.get(boundary) + 1);
            }
        }
        this.reservoir.update(value);
        return this;
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

    /**
     * Gets the buckets config object.
     *
     * @returns {Buckets}
     * @memberof Histogram
     */
    public getBuckets(): Buckets {
        return this.buckets;
    }

    /**
     * Gets the actual bucket counts.
     *
     * @returns {{ [boundary: number]: number; }}
     * @memberof Histogram
     */
    public getCounts(): Map<number, number> {
        return this.bucketCounts;
    }

}
