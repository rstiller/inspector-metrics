import "source-map-support/register";

import { Int64Wrapper } from "./int64";

/**
 * Interface fo all metric classes that build a sum of values.
 *
 * @export
 * @interface Summarizing
 */
export interface Summarizing {

  /**
   * Gets the sum of values.
   *
   * @returns {Int64Wrapper}
   * @memberof Summarizing
   */
  getSum(): Int64Wrapper;

}

/**
 * The serialized version of {@link Summarizing}.
 *
 * @export
 * @interface SerializableSummarizing
 */
export interface SerializableSummarizing {

  /**
   * int64 number in it's string representation.
   *
   * @type {string}
   * @memberof SerializableSummarizing
   */
  sum: string;

}
