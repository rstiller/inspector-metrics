import 'source-map-support'

import { MetricReporterOptions, Logger } from 'inspector-metrics'
import { PrometheusClusterOptions } from './PrometheusClusterOptions'

/**
 * Configuration object for {@link PrometheusMetricReporter}.
 *
 * @export
 * @interface PrometheusReporterOptions
 */
export interface PrometheusReporterOptions extends MetricReporterOptions {
  /**
   * indicates if UTC converted timestamps should be appended to each metric data
   *
   * @type {boolean}
   * @memberof PrometheusReporterOptions
   */
  readonly includeTimestamp?: boolean
  /**
   * indicates if comments like HELP and TYPE should be emitted
   *
   * @type {boolean}
   * @memberof PrometheusReporterOptions
   */
  readonly emitComments?: boolean
  /**
   * indicates if the untyped should always be used
   *
   * @type {boolean}
   * @memberof PrometheusReporterOptions
   */
  readonly useUntyped?: boolean
  /**
   * Options for clustering support.
   *
   * @type {PrometheusClusterOptions<any>}
   * @memberof PrometheusReporterOptions
   */
  clusterOptions?: PrometheusClusterOptions<any>
  /**
   * Minimal logger interface to report failures.
   *
   * @type {Logger}
   * @memberof PrometheusReporterOptions
   */
  log?: Logger
}
