import "source-map-support/register";

import * as cluster from "cluster";

import {
  Worker
} from "cluster";

import { Clock } from "../clock";
import { ReportMessageReceiver } from "./report-message-receiver";

const defaultCluster = (cluster.default || cluster) as any

/**
 * Common metrics options.
 *
 * @export
 * @interface ClusterOptions
 * @template Worker worker type placeholder
 */
export interface ClusterOptions<Worker> {
  /**
   * Indicates if clustering-support is enabled or not.
   *
   * @type {boolean}
   * @memberof ClusterOptions
   */
  readonly enabled: boolean;
  /**
   * Indicates if the {@link #sendToMaster} function should be used to send messages to the master process.
   *
   * @type {boolean}
   * @memberof ClusterOptions
   */
  readonly sendMetricsToMaster: boolean;
  /**
   * EventReceiver to get messages from master on forked processes or from forked processes on master.
   * Compatible with 'cluster'.
   *
   * @type {ReportMessageReceiver}
   * @memberof ClusterOptions
   */
  readonly eventReceiver: ReportMessageReceiver;
  /**
   * Function to send messages to the master-process.
   *
   * @param {*} message
   * @returns {Promise<any>}
   * @memberof ClusterOptions
   */
  sendToMaster(message: any): Promise<any>;
  /**
   * Function for sending message to a worker instance.
   *
   * @param {Worker} worker
   * @param {*} message
   * @returns {Promise<any>}
   * @memberof ClusterOptions
   */
  sendToWorker(worker: Worker, message: any): Promise<any>;
  /**
   * Gets a list of all workers.
   *
   * @returns {Promise<Worker[]>}
   * @memberof ClusterOptions
   */
  getWorkers(): Promise<Worker[]>;
}

/**
 * Options for the {@link MetricReporter}.
 *
 * @export
 * @interface MetricReporterOptions
 */
export interface MetricReporterOptions {
  /**
   * Clock used to determine the date for the reporting as well as the minimum-reporting timeout feature.
   *
   * @type {Clock}
   * @memberof MetricReporterOptions
   */
  readonly clock?: Clock;
  /**
   * Timeout in minutes a metric need to be included in the report without having changed.
   *
   * @type {number}
   * @memberof MetricReporterOptions
   */
  minReportingTimeout?: number;
  /**
   * Options for clustering support.
   *
   * @type {ClusterOptions<any>}
   * @memberof MetricReporterOptions
   */
  clusterOptions?: ClusterOptions<any>;
  /**
   * Tags for this reporter instance - to be combined with the tags of each metric while reporting.
   *
   * @type {Map<string, string>}
   * @memberof MetricReporterOptions
   */
  tags?: Map<string, string>;
}

/**
 * Default cluster setting applicable for most metric-reporter implementations.
 * Enables unidirectional message by sending metrics from forked processes to master process.
 *
 * @export
 * @class DefaultClusterOptions
 * @implements {ClusterOptions<Worker>}
 */
export class DefaultClusterOptions implements ClusterOptions<Worker> {
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
  public readonly eventReceiver: ReportMessageReceiver = defaultCluster;
  /**
   * Set to null.
   *
   * @memberof DefaultClusterOptions
   */
  public readonly getWorkers: () => Promise<Worker[]> = null;
  /**
   * True for forked processes.
   *
   * @type {boolean}
   * @memberof DefaultClusterOptions
   */
  public readonly sendMetricsToMaster: boolean = !!defaultCluster.worker;
  /**
   * Set to null.
   *
   * @memberof DefaultClusterOptions
   */
  public readonly sendToWorker: (worker: Worker, message: any) => Promise<any> = null;
  /**
   * Uses 'cluster.worker.send' to send messages.
   *
   * @memberof DefaultClusterOptions
   */
  public readonly sendToMaster: (message: any) => Promise<any> = async (message: any) => defaultCluster.worker.send(message);
}

/**
 * Disables clustering.
 *
 * @export
 * @class DisabledClusterOptions
 * @implements {ClusterOptions<Worker>}
 */
export class DisabledClusterOptions implements ClusterOptions<Worker> {
  /**
   * Set to false.
   *
   * @type {boolean}
   * @memberof DisabledClusterOptions
   */
  public readonly enabled: boolean = false;
  /**
   * Set to null.
   *
   * @type {ReportMessageReceiver}
   * @memberof DisabledClusterOptions
   */
  public readonly eventReceiver: ReportMessageReceiver = null;
  /**
   * Set to null.
   *
   * @memberof DisabledClusterOptions
   */
  public readonly getWorkers: () => Promise<Worker[]> = null;
  /**
   * Set to false.
   *
   * @type {boolean}
   * @memberof DisabledClusterOptions
   */
  public readonly sendMetricsToMaster: boolean = false;
  /**
   * Set to null.
   *
   * @memberof DisabledClusterOptions
   */
  public readonly sendToWorker: (worker: Worker, message: any) => Promise<any> = null;
  /**
   * Set to null.
   *
   * @memberof DisabledClusterOptions
   */
  public readonly sendToMaster: (message: any) => Promise<any> = null;
}
