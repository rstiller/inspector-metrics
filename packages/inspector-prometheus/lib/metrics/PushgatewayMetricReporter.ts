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

export class PushgatewayReporterOptions {
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
 *
 * @see https://github.com/prometheus/pushgateway
 * @export
 * @class PushgatewayMetricReporter
 * @extends {MetricReporter}
 */
export class PushgatewayMetricReporter extends MetricReporter {

    private reporter: PrometheusMetricReporter;
    private options: PushgatewayReporterOptions;
    private interval: number;
    private unit: TimeUnit;
    private timer: NodeJS.Timer;
    private logger: Logger;
    private scheduler: Scheduler;

    public constructor(
        reporter: PrometheusMetricReporter,
        options: PushgatewayReporterOptions,
        interval: number = 15,
        unit: TimeUnit = SECOND,
        logger: Logger = global.console,
        scheduler: Scheduler = setInterval) {
        super();

        this.interval = interval;
        this.unit = unit;
        this.reporter = reporter;
        this.options = options;
        this.logger = logger;
        this.scheduler = scheduler;
    }

    public start(): void {
        const interval: number = this.unit.convertTo(this.interval, MILLISECOND);
        this.timer = this.scheduler(() => this.report(), interval);
    }

    public stop(): void {
        this.timer.unref();
    }

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
