import "source-map-support";

import {
    MetricReporter,
    MILLISECOND,
    TimeUnit,
} from "inspector-metrics";
import { PrometheusMetricReporter } from "./PrometheusMetricReporter";

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
    private interval: number;
    private unit: TimeUnit;
    private timer: NodeJS.Timer;

    public constructor(
        reporter: PrometheusMetricReporter,
        interval: number = 5000,
        unit: TimeUnit = MILLISECOND) {
        super();

        this.interval = interval;
        this.unit = unit;
        this.reporter = reporter;
    }

    public start(): void {
        const interval: number = this.unit.convertTo(this.interval, MILLISECOND);
        this.timer = setInterval(() => this.report(), interval);
    }

    public stop(): void {
        this.timer.unref();
    }

    private async report() {
        // TODO: send to pushgateway
        this.reporter.getMetricsString();
    }

}
