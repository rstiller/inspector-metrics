import "source-map-support";

import * as http from "http";
import {
    Logger,
    MetricReporter,
    MILLISECOND,
    Scheduler,
    SECOND,
    TimeUnit,
} from "inspector-metrics";
import { PrometheusMetricReporter } from "./PrometheusMetricReporter";

/**
 * Configuration object for {@link PushgatewayMetricReporter}.
 *
 * @export
 * @class PushgatewayReporterOptions
 */
export class PushgatewayReporterOptions {

    /**
     * Creates an instance of PushgatewayReporterOptions.
     *
     * @param {string} [host=""] the hostname or ip address of the pushgateway
     * @param {number} [port=9091] the port of the pushgateway
     * @param {string} [job=""] the id of the job
     * @param {string} [instance=""] the id of this instance
     * @memberof PushgatewayReporterOptions
     */
    constructor(
        public readonly host: string = "",
        public readonly port: number = 9091,
        public readonly job: string = "",
        public readonly instance: string = "",
    ) {
    }

}

/**
 * Metric reporter for prometheus's pushgateway.
 * Simply sends the output of the provided {@link PrometheusMetricReporter}
 * to the configurated pushgateway using the text format.
 *
 * @see https://github.com/prometheus/pushgateway
 * @export
 * @class PushgatewayMetricReporter
 * @extends {MetricReporter}
 */
export class PushgatewayMetricReporter extends MetricReporter {

    /**
     * The reporter use ot generate the metrics string.
     *
     * @private
     * @type {PrometheusMetricReporter}
     * @memberof PushgatewayMetricReporter
     */
    private reporter: PrometheusMetricReporter;
    /**
     * The configuration object.
     *
     * @private
     * @type {PushgatewayReporterOptions}
     * @memberof PushgatewayMetricReporter
     */
    private options: PushgatewayReporterOptions;
    /**
     * The interval in {@link PushgatewayMetricReporter#unit} in which this reporter send data
     * to the pushgateway.
     *
     * @private
     * @type {number}
     * @memberof PushgatewayMetricReporter
     */
    private interval: number;
    /**
     * The time unit the reporting interval is interpreted with.
     *
     * @private
     * @type {TimeUnit}
     * @memberof PushgatewayMetricReporter
     */
    private unit: TimeUnit;
    /**
     * A reference to the NodeJS Timer object created by the scheduler
     * function - most likely the {@code setInterval()} function.
     *
     * @private
     * @type {NodeJS.Timer}
     * @memberof PushgatewayMetricReporter
     */
    private timer: NodeJS.Timer;
    /**
     * A simplified logger interface to log response code and message of the pushgateway.
     *
     * @private
     * @type {Logger}
     * @memberof PushgatewayMetricReporter
     */
    private logger: Logger;
    /**
     * The scheduler function used to schedule the reporting wit the given interval.
     *
     * @private
     * @type {Scheduler}
     * @memberof PushgatewayMetricReporter
     */
    private scheduler: Scheduler;

    /**
     * Creates an instance of PushgatewayMetricReporter.
     *
     * @param {PrometheusMetricReporter} reporter
     * @param {PushgatewayReporterOptions} options
     * @param {number} [interval=15]
     * @param {TimeUnit} [unit=SECOND]
     * @param {Logger} [logger=null]
     * @param {Scheduler} [scheduler=setInterval]
     * @memberof PushgatewayMetricReporter
     */
    public constructor(
        reporter: PrometheusMetricReporter,
        options: PushgatewayReporterOptions,
        interval: number = 15,
        unit: TimeUnit = SECOND,
        logger: Logger = null,
        scheduler: Scheduler = setInterval) {
        super();

        this.interval = interval;
        this.unit = unit;
        this.reporter = reporter;
        this.options = options;
        this.logger = logger;
        this.scheduler = scheduler;
    }

    /**
     * Uses the scheduler function to call the {@link PushgatewayMetricReporter#report} function
     * in the interval specified. The interval is converted into {@link MILLISECOND}s.
     *
     * @memberof PushgatewayMetricReporter
     */
    public start(): void {
        const interval: number = this.unit.convertTo(this.interval, MILLISECOND);
        this.timer = this.scheduler(() => this.report(), interval);
    }

    /**
     * Stops the scheduled reporting.
     *
     * @memberof PushgatewayMetricReporter
     */
    public stop(): void {
        if (this.timer) {
            this.timer.unref();
        }
    }

    /**
     * Calls the reporter t generate the metrics in a valid prometheus text format.
     * Sends the metrics via 'PUT' to the configured pushgateway.
     *
     * @private
     * @returns {string}
     * @memberof PushgatewayMetricReporter
     */
    private report(): string {
        const payload = this.reporter.getMetricsString();
        const options = {
            headers: {
                "Content-Length": payload.length,
                "Content-Type": "text/plain",
            },
            host: this.options.host,
            method: "PUT",
            path: `/metrics/job/${this.options.job}/instance/${this.options.instance}`,
            port: `${this.options.port}`,
        };

        const req = http.request(options, (res) => {
            if (this.logger) {
                this.logger.debug(`${res.statusCode} ${res.statusMessage}`);
            }
        });
        req.write(payload);
        req.end();

        return payload;
    }

}
