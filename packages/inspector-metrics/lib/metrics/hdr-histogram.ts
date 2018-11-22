import "source-map-support/register";

import { BucketCounting, Buckets, Counting } from "./counting";
import { Histogram } from "./histogram";
import { Metric } from "./metric";
import { Sampling } from "./sampling";
import { Snapshot } from "./snapshot";
import { Summarizing } from "./summarizing";

/**
 * The 'native-hdr-histogram' module (optional).
 */
let NativeHistogram: any = null;
try {
    NativeHistogram = require("native-hdr-histogram");
} catch (e) {
}

/**
 * Snapshot implementation for a {@link HdrHistogram} reference.
 *
 * @export
 * @class HdrSnapshot
 * @implements {Snapshot}
 */
export class HdrSnapshot implements Snapshot {

    /**
     * Creates an instance of HdrSnapshot.
     * @param {*} reference
     * @memberof HdrSnapshot
     */
    public constructor(private reference: any) {
    }

    /**
     * Calls the native hrd-histogram implementation of the
     * referenced {@link HdrHistogram} for the 75th percentile.
     *
     * @returns {number}
     * @memberof HdrSnapshot
     */
    public get75thPercentile(): number {
        return this.reference.histogram.percentile(75);
    }

    /**
     * Calls the native hrd-histogram implementation of the
     * referenced {@link HdrHistogram} for the 95th percentile.
     *
     * @returns {number}
     * @memberof HdrSnapshot
     */
    public get95thPercentile(): number {
        return this.reference.histogram.percentile(95);
    }

    /**
     * Calls the native hrd-histogram implementation of the
     * referenced {@link HdrHistogram} for the 98th percentile.
     *
     * @returns {number}
     * @memberof HdrSnapshot
     */
    public get98thPercentile(): number {
        return this.reference.histogram.percentile(98);
    }

    /**
     * Calls the native hrd-histogram implementation of the
     * referenced {@link HdrHistogram} for the 99.9th percentile.
     *
     * @returns {number}
     * @memberof HdrSnapshot
     */
    public get999thPercentile(): number {
        return this.reference.histogram.percentile(99.9);
    }

    /**
     * Calls the native hrd-histogram implementation of the
     * referenced {@link HdrHistogram} for the 99th percentile.
     *
     * @returns {number}
     * @memberof HdrSnapshot
     */
    public get99thPercentile(): number {
        return this.reference.histogram.percentile(99);
    }

    /**
     * Calls the native hrd-histogram implementation of the
     * referenced {@link HdrHistogram} for the 50th percentile.
     *
     * @returns {number}
     * @memberof HdrSnapshot
     */
    public getMedian(): number {
        return this.reference.histogram.percentile(50);
    }

    /**
     * Calls the native hrd-histogram implementation of the
     * referenced {@link HdrHistogram} for the max value - if NaN returns 0.
     *
     * @returns {number}
     * @memberof HdrSnapshot
     */
    public getMax(): number {
        return this.reference.histogram.max() || 0;
    }

    /**
     * Calls the native hrd-histogram implementation of the
     * referenced {@link HdrHistogram} for the min value - if NaN returns 0.
     *
     * @returns {number}
     * @memberof HdrSnapshot
     */
    public getMin(): number {
        return this.reference.histogram.min() || 0;
    }

    /**
     * Always returns an empty array.
     *
     * @returns {number[]}
     * @memberof HdrSnapshot
     */
    public getValues(): number[] {
        return [];
    }

    /**
     * Returns the count of all values recorded.
     *
     * @returns {number}
     * @memberof HdrSnapshot
     */
    public size(): number {
        return this.reference.getCount();
    }

    /**
     * Calls the native hrd-histogram implementation of the
     * referenced {@link HdrHistogram} for the mean value - if NaN returns 0.
     *
     * @returns {number}
     * @memberof HdrSnapshot
     */
    public getMean(): number {
        return this.reference.histogram.mean() || 0;
    }

    /**
     * Calls the native hrd-histogram implementation of the
     * referenced {@link HdrHistogram} for the standard deviation - if NaN returns 0.
     *
     * @returns {number}
     * @memberof HdrSnapshot
     */
    public getStdDev(): number {
        return this.reference.histogram.stddev() || 0;
    }

    /**
     * Calls the native hrd-histogram implementation of the
     * referenced {@link HdrHistogram} for the given percentile.
     *
     * @returns {number}
     * @memberof HdrSnapshot
     */
    public getValue(quantile: number): number {
        return this.reference.histogram.percentile(quantile * 100.0);
    }

}

/**
 * Wrapper implementation for the native hdr-histogram provided by 'native-hdr-histogram' module.
 *
 * @export
 * @class HdrHistogram
 * @extends {Histogram}
 * @implements {BucketCounting}
 * @implements {Counting}
 * @implements {Metric}
 * @implements {Sampling}
 * @implements {Summarizing}
 */
export class HdrHistogram extends Histogram implements BucketCounting, Counting, Metric, Sampling, Summarizing {

    /**
     * histogram instance.
     *
     * @private
     * @type {*}
     * @memberof HdrHistogram
     */
    private histogram: any;
    /**
     * Snapshot instance.
     *
     * @private
     * @type {HdrSnapshot}
     * @memberof HdrHistogram
     */
    private snapshot: HdrSnapshot;

    /**
     * Creates an instance of HdrHistogram.
     * Throws anerror if the 'native-hdr-histogram' module is not installed.
     *
     * @param {number} [lowest=1] is the lowest possible number that can be recorded
     * @param {number} [max=100] is the maximum number that can be recorded
     * @param {number} [figures=3]
     *      the number of figures in a decimal number that will be maintained, must be between 1 and 5 (inclusive)
     * @param {string} [name]
     * @param {string} [description]
     * @param {Buckets} [buckets=new Buckets()]
     * @memberof HdrHistogram
     */
    public constructor(
        lowest: number = 1,
        max: number = 100,
        figures: number = 3,
        name?: string,
        description?: string,
        buckets: Buckets = new Buckets()) {
        super(null, name, description, buckets);

        if (!NativeHistogram) {
            throw new Error("Module 'native-hdr-histogram' not found. " +
                            "Please install the optional dependencies of 'inspector-metrics' module.");
        }

        this.histogram = new NativeHistogram(lowest, max, figures);
        this.snapshot = new HdrSnapshot(this);
    }

    /**
     * Gets the snapshot instance.
     *
     * @returns {Snapshot}
     * @memberof HdrHistogram
     */
    public getSnapshot(): Snapshot {
        return this.snapshot;
    }

    /**
     * Updates the histogram, all counters and th overall sum with the given value.
     *
     * @param {number} value
     * @returns {this}
     * @memberof HdrHistogram
     */
    public update(value: number): this {
        this.count++;
        this.sum.add(value);
        for (const boundary of this.buckets.boundaries) {
            if (value < boundary) {
                this.bucketCounts.set(boundary, this.bucketCounts.get(boundary) + 1);
            }
        }
        this.histogram.record(value);
        return this;
    }

}
