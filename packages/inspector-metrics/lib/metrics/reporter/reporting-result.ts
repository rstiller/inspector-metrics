import "source-map-support/register";

import { Metric, SerializableMetric } from "../model/metric";

/**
 * Helper interface for reporting results.
 */
export interface ReportingResult<M extends Metric | SerializableMetric, T> {
  /**
   * The metric the result refers to.
   *
   * @type {M}
   * @memberof ReportingResult
   */
  readonly metric: M;
  /**
   * The reporting result - implementation specific.
   *
   * @type {T}
   * @memberof ReportingResult
   */
  readonly result: T;
}
