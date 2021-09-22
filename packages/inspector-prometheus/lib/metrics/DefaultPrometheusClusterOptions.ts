import 'source-map-support'

import * as cluster from 'cluster'
import {
  Worker
} from 'cluster'

import { ReportMessageReceiver } from 'inspector-metrics'
import { PrometheusClusterOptions } from './PrometheusClusterOptions'

const defaultCluster = (cluster.default || cluster) as any

/**
 * Default configuration for clustering support for the {@link PrometheusMetricReporter}.
 *
 * @export
 * @class DefaultPrometheusClusterOptions
 * @implements {PrometheusClusterOptions<Worker>}
 */
export class DefaultPrometheusClusterOptions implements PrometheusClusterOptions<Worker> {
  /**
   * Sets the timeout in which a forked process can respond to metric report requests.
   *
   * @type {number}
   * @memberof DefaultPrometheusClusterOptions
   */
  public readonly workerResponseTimeout: number = 500;
  /**
   * Set to true.
   *
   * @type {boolean}
   * @memberof DefaultClusterOptions
   */
  public readonly enabled: boolean = true;
  /**
   * Set to cluster module.
   *
   * @type {ReportMessageReceiver}
   * @memberof DefaultClusterOptions
   */
  public readonly eventReceiver: ReportMessageReceiver;
  /**
   * True for forked processes.
   *
   * @type {boolean}
   * @memberof DefaultClusterOptions
   */
  public readonly sendMetricsToMaster: boolean = defaultCluster.isWorker;

  public constructor () {
    if (defaultCluster.isWorker) {
      this.eventReceiver = {
        on: (
          messageType: any,
          callback: (worker: Worker, message: any, handle: any) => void) => {
          process.on(messageType, (message) => callback(null, message, null))
        }
      }
    } else {
      this.eventReceiver = defaultCluster
    }
  }

  /**
   * Uses 'worker.send' to send the specified message to the specified worker.
   *
   * @memberof DefaultClusterOptions
   */
  public async sendToWorker (worker: Worker, message: any): Promise<any> {
    if (worker) {
      worker.send(message)
    }
  }

  /**
   * Returns the values of 'workers'.
   *
   * @memberof DefaultClusterOptions
   */
  public async getWorkers (): Promise<Worker[]> {
    const workers: Worker[] = []
    if (workers) {
      for (const key of Object.keys(workers)) {
        workers.push(workers[key as any])
      }
    }
    return workers
  }

  /**
   * Uses 'process.send' to send messages.
   *
   * @memberof DefaultClusterOptions
   */
  public async sendToMaster (message: any): Promise<any> {
    process.send(message)
  }
}
