import "source-map-support/register";

import { BaseMetric } from "./metric";

/**
 * An event is a special kind of metric representing something that needs to be reported as is.
 * It doesn't need to be tracked in time, and can have tags and fields.
 *
 * @export
 * @class Event
 * @extends {BaseMetric}
 * @template T
 */
export class Event<T> extends BaseMetric {

  /**
   * The value.
   *
   * @private
   * @type {T}
   * @memberof Event
   */
  private value: T;

  /**
   * Creates an instance of Event with an optional name.
   *
   * @param {string} [name] optional metric name.
   * @param {string} [description] optional metric description.
   * @memberof Event
   */
  public constructor(name?: string, description?: string) {
    super();
    this.name = name;
    this.description = description;
  }

  /**
   * Gets the current value.
   *
   * @returns {T}
   * @memberof Event
   */
  public getValue(): T {
    return this.value;
  }

  /**
   * Sets the current value.
   *
   * @param {T} value
   * @returns {ThisType}
   * @memberof Event
   */
  public setValue(value: T): this {
    this.value = value;
    return this;
  }

}
