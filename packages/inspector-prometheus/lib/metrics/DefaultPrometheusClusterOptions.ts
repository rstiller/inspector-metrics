import "source-map-support";

import * as cluster from "cluster";

import { ReportMessageReceiver } from "inspector-metrics";
import { PrometheusClusterOptions } from "./PrometheusClusterOptions";

/**
 * Default configuration for clustering support for the {@link PrometheusMetricReporter}.
 *
 * @export
 * @class DefaultPrometheusClusterOptions
 * @implements {PrometheusClusterOptions<cluster.Worker>}
 */
export class DefaultPrometheusClusterOptions implements PrometheusClusterOptions<cluster.Worker> {
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
    public readonly eventReceiver: ReportMessageReceiver = cluster;
    /**
     * True for forked processes.
     *
     * @type {boolean}
     * @memberof DefaultClusterOptions
     */
    public readonly sendMetricsToMaster: boolean = !!cluster.worker;
    /**
     * Uses 'worker.send' to send the specified message to the specified worker.
     *
     * @memberof DefaultClusterOptions
     */
    public async sendToWorker(worker: cluster.Worker, message: any): Promise<any> {
        if (worker) {
            worker.send(message);
        }
    }
    /**
     * Returns the values of 'cluster.workers'.
     *
     * @memberof DefaultClusterOptions
     */
    public async getWorkers(): Promise<cluster.Worker[]> {
        const workers: cluster.Worker[] = [];
        for (const key of Object.keys(cluster.workers)) {
            workers.push(cluster.workers[key]);
        }
        return workers;
    }
    /**
     * Uses 'cluster.worker.send' to send messages.
     *
     * @memberof DefaultClusterOptions
     */
    public async sendToMaster(message: any): Promise<any> {
        cluster.worker.send(message);
    }
}
