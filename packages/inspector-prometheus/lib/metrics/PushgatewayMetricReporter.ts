import "source-map-support";

import * as http from "http";
import {
    Counter,
    Event,
    Gauge,
    Histogram,
    Logger,
    Meter,
    MetricRegistry,
    MetricSetReportContext,
    MetricType,
    MILLISECOND,
    MonotoneCounter,
    OverallReportContext,
    ReportingResult,
    ScheduledMetricReporter,
    ScheduledMetricReporterOptions,
    StdClock,
    Timer,
} from "inspector-metrics";
import { PrometheusMetricReporter } from "./PrometheusMetricReporter";

/**
 * Configuration object for {@link PushgatewayMetricReporter}.
 *
 * @export
 * @interface PushgatewayReporterOptions
 */
export interface PushgatewayReporterOptions extends ScheduledMetricReporterOptions {
    /**
     * The hostname or ip address of the pushgateway
     *
     * @type {string}
     * @memberof PushgatewayReporterOptions
     */
    readonly host?: string;
    /**
     * The port of the pushgateway.
     *
     * @type {number}
     * @memberof PushgatewayReporterOptions
     */
    readonly port?: number;
    /**
     * The id of the job.
     *
     * @type {string}
     * @memberof PushgatewayReporterOptions
     */
    readonly job?: string;
    /**
     * The id of this instance.
     *
     * @type {string}
     * @memberof PushgatewayReporterOptions
     */
    readonly instance?: string;
    /**
     * The reporter use ot generate the metrics string.
     *
     * @type {PrometheusMetricReporter}
     * @memberof PushgatewayReporterOptions
     */
    readonly reporter?: PrometheusMetricReporter;
    /**
     * A simplified logger interface to log response code and message of the pushgateway.
     *
     * @type {Logger}
     * @memberof PushgatewayReporterOptions
     */
    log?: Logger;
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
export class PushgatewayMetricReporter extends ScheduledMetricReporter<PushgatewayReporterOptions, any> {

    /**
     * Creates an instance of PushgatewayMetricReporter.
     *
     * @memberof PushgatewayMetricReporter
     */
    public constructor({
        clock = new StdClock(),
        host = "",
        instance = "",
        job = "",
        log = console,
        minReportingTimeout = 1,
        port = 9091,
        reporter,
        reportInterval = 1000,
        scheduler = setInterval,
        tags = new Map(),
        unit = MILLISECOND,
    }: PushgatewayReporterOptions) {
        super({
            clock,
            host,
            instance,
            job,
            log,
            minReportingTimeout,
            port,
            reportInterval,
            reporter,
            scheduler,
            tags,
            unit,
        });
    }

    /**
     * Uses {@link PrometheusMetricReporter#getEventString} to build the string and sends the event
     * straight to the pushgateway.
     *
     * @param {Event} event
     * @returns {Promise<Event>} always the specified event.
     * @memberof PushgatewayMetricReporter
     */
    public async reportEvent<TEventData, TEvent extends Event<TEventData>>(event: TEvent): Promise<TEvent> {
        const payload = await this.options.reporter.getEventString(event);

        this.sendPayload(payload);

        return event;
    }

    /**
     * Does nothing.
     *
     * @returns {Promise<void>}
     * @memberof PushgatewayMetricReporter
     */
    public async flushEvents(): Promise<void> {
    }

    /**
     * Calls the {@link PrometheusMetricReporter} to generate the metrics in a valid prometheus text format.
     * Sends the metrics via 'PUT' to the configured pushgateway.
     *
     * @protected
     * @memberof PushgatewayMetricReporter
     */
    protected async report(): Promise<OverallReportContext> {
        const ctx = this.createOverallReportContext();
        const payload = await this.options.reporter.getMetricsString();

        this.sendPayload(payload);

        ctx.result = payload;
        return ctx;
    }

    /**
     * Sends the specified payload to the prometheus pushgateway.
     *
     * @protected
     * @param {string} payload
     * @memberof PushgatewayMetricReporter
     */
    protected sendPayload(payload: string) {
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
            if (this.options.log) {
                this.options.log.trace(`${res.statusCode} ${res.statusMessage}`);
            }
        });
        req.write(payload);
        req.end();
    }

    /**
     * Not implemented.
     *
     * @protected
     * @memberof PushgatewayMetricReporter
     */
    protected async handleResults(
        ctx: OverallReportContext,
        registry: MetricRegistry,
        date: Date,
        type: MetricType,
        results: Array<ReportingResult<any, any>>): Promise<any> {
    }

    /**
     * Not implemented.
     *
     * @protected
     * @memberof PushgatewayMetricReporter
     */
    protected reportCounter(
        counter: MonotoneCounter | Counter,
        ctx: MetricSetReportContext<MonotoneCounter | Counter>) {
    }

    /**
     * Not implemented.
     *
     * @protected
     * @memberof PushgatewayMetricReporter
     */
    protected reportGauge(gauge: Gauge<any>, ctx: MetricSetReportContext<Gauge<any>>) {
    }

    /**
     * Not implemented.
     *
     * @protected
     * @memberof PushgatewayMetricReporter
     */
    protected reportHistogram(histogram: Histogram, ctx: MetricSetReportContext<Histogram>) {
    }

    /**
     * Not implemented.
     *
     * @protected
     * @memberof PushgatewayMetricReporter
     */
    protected reportMeter(meter: Meter, ctx: MetricSetReportContext<Meter>) {
    }

    /**
     * Not implemented.
     *
     * @protected
     * @memberof PushgatewayMetricReporter
     */
    protected reportTimer(timer: Timer, ctx: MetricSetReportContext<Timer>) {
    }

}
