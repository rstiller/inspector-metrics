import "source-map-support/register";

import { Metric, SerializableMetric } from "./metric";

/**
 * Represents everything that is countable ({@link Counter}, {@link MonotoneCounter}, {@link Histogram}).
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

/**
 * Contains boundaries used to mark one end of a value range.
 *
 * @export
 * @class Buckets
 */
export class Buckets {

  /**
   * Creates a new Buckets object with linear-distributed values.
   *
   * @static
   * @param {number} start
   * @param {number} bucketWidth
   * @param {number} count
   * @param {number} [precision=10000]
   * @returns {Buckets}
   * @memberof Buckets
   */
  public static linear(start: number, bucketWidth: number, count: number, precision = 10000): Buckets {
    const boundaries = new Array(count);
    const buckets = new Buckets(boundaries);
    for (let i = 0; i < count; i++) {
      buckets.boundaries[i] = start;
      buckets.boundaries[i] *= precision;
      buckets.boundaries[i] = Math.floor(buckets.boundaries[i]);
      buckets.boundaries[i] /= precision;
      start += bucketWidth;
    }
    return buckets;
  }

  /**
   * Creates a new Buckets object with exponentially distributed values.
   *
   * @static
   * @param {number} initial
   * @param {number} factor
   * @param {number} count
   * @param {number} [precision=10000]
   * @returns {Buckets}
   * @memberof Buckets
   */
  public static exponential(initial: number, factor: number, count: number, precision = 10000): Buckets {
    if (initial <= 0.0) {
      throw new Error("initial values needs to be greater than 0.0");
    }
    if (count < 1.0) {
      throw new Error("count needs to be at least 1");
    }
    if (factor <= 1.0) {
      throw new Error("factor needs to be greater than 1.0");
    }

    const boundaries = new Array(count);
    const buckets = new Buckets(boundaries);
    buckets.boundaries[0] = initial;
    for (let i = 1; i < count; i++) {
      buckets.boundaries[i] = buckets.boundaries[i - 1] * factor;
      buckets.boundaries[i] *= precision;
      buckets.boundaries[i] = Math.floor(buckets.boundaries[i]);
      buckets.boundaries[i] /= precision;
    }
    return buckets;
  }

  /**
   * Creates an instance of Buckets.
   *
   * @param {number[]} [boundaries=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]]
   * @memberof Buckets
   */
  constructor(
    public readonly boundaries: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  ) {
    boundaries.sort((a: number, b: number) => a - b);
  }

}

/**
 * Interface for defining a collection of boundaries to count events (e.g. method calls, requests per time-unit).
 * The meaning of the counts is implementation-specific.
 *
 * @export
 * @interface BucketCounting
 * @extends {Metric}
 */
export interface BucketCounting extends Metric {

  /**
   * Gets the current Buckets object used to do the counting.
   *
   * @returns {Buckets}
   * @memberof BucketCounting
   */
  getBuckets(): Buckets;

  /**
   * Gets a mapping from the boundary to the count of events
   * within the corresponding boundary.
   * The meaning of the count is implementation specific.
   *
   * @returns {Map<number, number>}
   * @memberof BucketCounting
   */
  getCounts(): Map<number, number>;

}

/**
 * Helper interface for serialized bucket counts.
 */
export interface BucketToCountMap {
  [bucket: number]: number;
}

/**
 * Serialized version of {@link BucketCounting}.
 *
 * @export
 * @interface SerializableBucketCounting
 * @extends {SerializableMetric}
 */
export interface SerializableBucketCounting extends SerializableMetric {

  /**
   * The boundaries used to do the counting.
   *
   * @returns {number[]}
   * @memberof SerializableBucketCounting
   */
  buckets: number[];

  /**
   * Mapping: boundary to the count of events within boundary.
   * The meaning of the count is implementation specific.
   *
   * @returns {BucketToCountMap}
   * @memberof SerializableBucketCounting
   */
  counts: BucketToCountMap;

}

/**
 * Determines if the metric passed is a {@link SerializableBucketCounting} or not.
 *
 * @export
 * @param {(BucketCounting | SerializableBucketCounting)} metric
 * @returns {metric is SerializableBucketCounting}
 */
export function isSerializableBucketCounting(
  metric: BucketCounting | SerializableBucketCounting): metric is SerializableBucketCounting {
  const anyMetric: any = metric as any;
  if ((anyMetric.getBuckets && typeof anyMetric.getBuckets === "function") ||
    (anyMetric.getCounts && typeof anyMetric.getCounts === "function")) {
    return false;
  }
  return Array.isArray(anyMetric.buckets);
}

/**
 * Convenience method the get the {@link Buckets} of a
 * {@link BucketCounting} or a {@link SerializableBucketCounting}.
 *
 * @export
 * @param {(BucketCounting | SerializableBucketCounting)} metric
 * @returns {Buckets}
 */
export function getMetricBuckets(metric: BucketCounting | SerializableBucketCounting): Buckets {
  if (isSerializableBucketCounting(metric)) {
    return new Buckets(metric.buckets);
  } else {
    return metric.getBuckets();
  }
}

/**
 * Convenience method the get the counts of a
 * {@link BucketCounting} or a {@link SerializableBucketCounting}.
 *
 * @export
 * @param {(BucketCounting | SerializableBucketCounting)} metric
 * @returns {BucketToCountMap}
 */
export function getMetricCounts(metric: BucketCounting | SerializableBucketCounting): BucketToCountMap {
  if (isSerializableBucketCounting(metric)) {
    return metric.counts;
  } else {
    const counts: BucketToCountMap = {};
    for (const [bucket, count] of metric.getCounts()) {
      counts[bucket] = count;
    }
    return counts;
  }
}
