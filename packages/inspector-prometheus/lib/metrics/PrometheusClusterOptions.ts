import 'source-map-support'

import { ClusterOptions } from 'inspector-metrics'

/**
 * Extends the standard {@link ClusterOptions} with a timeout for worker processes
 * to response to metric report requests.
 *
 * @export
 * @interface PrometheusClusterOptions
 * @extends {ClusterOptions<Worker>}
 * @template Worker
 */
export interface PrometheusClusterOptions<Worker> extends ClusterOptions<Worker> {
  /**
   * Sets the timeout in which a forked process can respond to metric report requests.
   *
   * @type {number}
   * @memberof PrometheusClusterOptions
   */
  readonly workerResponseTimeout: number
}
