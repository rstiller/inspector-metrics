import 'source-map-support/register'

import { BucketCounting, Buckets, BucketToCountMap, Counting, SerializableBucketCounting } from './model/counting'
import { Int64Wrapper } from './model/int64'
import { BaseMetric, Metric } from './model/metric'
import { Reservoir } from './model/reservoir'
import { Sampling, SerializableSampling } from './model/sampling'
import { SerializedSnapshot, Snapshot } from './model/snapshot'
import { SerializableSummarizing, Summarizing } from './model/summarizing'

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
export class Histogram extends BaseMetric implements
    BucketCounting, Counting, Metric, Sampling, Summarizing,
    SerializableSummarizing, SerializableBucketCounting,
    SerializableSampling {
  /**
   * The value reservoir used to do sampling.
   *
   * @private
   * @type {Reservoir}
   * @memberof Histogram
   */
  protected readonly reservoir: Reservoir
  /**
   * Continuous number representing the update operations executed.
   *
   * @private
   * @type {number}
   * @memberof Histogram
   */
  protected count: number = 0
  /**
   * Sum of all values.
   *
   * @private
   * @type {number}
   * @memberof Histogram
   */
  protected sumInternal: Int64Wrapper = new Int64Wrapper()
  /**
   * Contains all counts based on {@link Histogram#buckets}.
   *
   * @private
   * @type {{ [boundary: number]: number }}
   * @memberof Histogram
   */
  protected readonly bucketCounts: Map<number, number> = new Map()
  /**
   * The bucket config used to count.
   *
   * @private
   * @type {Buckets}
   * @memberof Histogram
   */
  protected readonly bucketsInternal: Buckets

  /**
   * Creates an instance of Histogram.
   *
   * @param {Reservoir} reservoir the number reservoir used
   * @param {string} [name] an optional metric name
   * @param {string} [description] an optional metric description
   * @memberof Histogram
   */
  public constructor (reservoir: Reservoir, name?: string, description?: string, buckets: Buckets = new Buckets()) {
    super()
    this.reservoir = reservoir
    this.name = name
    this.description = description
    this.bucketsInternal = buckets
    for (const boundary of this.bucketsInternal.boundaries) {
      this.bucketCounts.set(boundary, 0)
    }
  }

  /**
   * Gets the buckets in serialized form.
   *
   * @returns {number[]}
   * @memberof Histogram
   */
  public get buckets (): number[] {
    return this.bucketsInternal.boundaries
  }

  /**
   * Gets the actual bucket counts in serialized form.
   *
   * @returns {BucketToCountMap}
   * @memberof Histogram
   */
  public get counts (): BucketToCountMap {
    const counts: BucketToCountMap = {}
    for (const [bucket, count] of this.bucketCounts) {
      counts[bucket] = count
    }
    return counts
  }

  /**
   * Getter for sum property extracting the string representation from internal sum property (64bit number).
   *
   * @readonly
   * @type {string}
   * @memberof Histogram
   */
  public get sum (): string {
    return this.sumInternal.toString()
  }

  /**
   * Gets the {@link SerializedSnapshot} from the reservoir.
   *
   * @readonly
   * @type {SerializedSnapshot}
   * @memberof Histogram
   */
  public get snapshot (): SerializedSnapshot {
    return {
      values: this.reservoir.snapshot().getValues()
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
  public update (value: number): this {
    this.count++
    this.sumInternal.add(value)
    for (const boundary of this.bucketsInternal.boundaries) {
      if (value < boundary) {
        this.bucketCounts.set(boundary, this.bucketCounts.get(boundary) + 1)
      }
    }
    this.reservoir.update(value)
    return this
  }

  /**
   * Gets the snapshot of the reservoir.
   *
   * @returns {Snapshot}
   * @memberof Histogram
   */
  public getSnapshot (): Snapshot {
    return this.reservoir.snapshot()
  }

  /**
   * Gets the count of update operations executed.
   *
   * @returns {number}
   * @memberof Histogram
   */
  public getCount (): number {
    return this.count
  }

  /**
   * Gets the sum of all values.
   *
   * @returns {Int64Wrapper}
   * @memberof Histogram
   */
  public getSum (): Int64Wrapper {
    return this.sumInternal
  }

  /**
   * Gets the buckets config object.
   *
   * @returns {Buckets}
   * @memberof Histogram
   */
  public getBuckets (): Buckets {
    return this.bucketsInternal
  }

  /**
   * Gets the actual bucket counts.
   *
   * @returns {Map<number, number>}
   * @memberof Histogram
   */
  public getCounts (): Map<number, number> {
    return this.bucketCounts
  }

  /**
   * Same as {@link BaseMetric#toJSON()}, also adding
   * bucketCounts, buckets, count and sum (64bit number stringified) property.
   *
   * @returns {*}
   * @memberof Histogram
   */
  public toJSON (): any {
    const json = super.toJSON()
    json.counts = {}
    for (const [key, value] of this.bucketCounts) {
      json.counts[key] = value
    }
    json.buckets = this.bucketsInternal.boundaries
    json.count = this.count
    json.sum = this.sumInternal.toString()
    json.snapshot = this.snapshot
    return json
  }
}
