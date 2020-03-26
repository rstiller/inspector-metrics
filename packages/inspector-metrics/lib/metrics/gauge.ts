import 'source-map-support/register'

import { BaseMetric, Metric, SerializableMetric } from './model/metric'

/**
 * A gauge can represent any value - regardless of the type.
 *
 * @export
 * @interface Gauge
 * @extends {Metric}
 * @extends {SerializableMetric}
 * @template T
 */
export interface Gauge<T> extends Metric, SerializableMetric {

  /**
   * Gets the current value of the gauge.
   *
   * @returns {T}
   * @memberof Gauge
   */
  getValue(): T

}

/**
 * A simple number-base gauge - e.g. for reporting the current size of an array or map or queue.
 *
 * @export
 * @class SimpleGauge
 * @extends {BaseMetric}
 * @implements {Gauge<number>}
 */
export class SimpleGauge extends BaseMetric implements Gauge<number> {
  /**
   * The value - initially set to 0.
   *
   * @private
   * @type {number}
   * @memberof SimpleGauge
   */
  private value: number = 0;

  /**
   * Creates an instance of SimpleGauge with an optional name.
   *
   * @param {string} [name] optional metric name.
   * @param {string} [description] optional metric description.
   * @memberof SimpleGauge
   */
  public constructor (name?: string, description?: string) {
    super()
    this.name = name
    this.description = description
  }

  /**
   * Gets the current value.
   *
   * @returns {number}
   * @memberof SimpleGauge
   */
  public getValue (): number {
    return this.value
  }

  /**
   * Sets the current value.
   *
   * @param {number} value
   * @returns {this}
   * @memberof SimpleGauge
   */
  public setValue (value: number): this {
    this.value = value
    return this
  }

  /**
   * Same as {@link BaseMetric#toJSON()}, also adding value property.
   *
   * @returns {*}
   * @memberof SimpleGauge
   */
  public toJSON (): any {
    const json = super.toJSON()
    json.value = this.value
    return json
  }
}
