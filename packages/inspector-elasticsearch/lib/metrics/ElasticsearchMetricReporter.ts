import "source-map-support/register";

import { Client, ConfigOptions } from "elasticsearch";
import {
    Clock,
    Counter,
    Event,
    Gauge,
    Histogram,
    Logger,
    Meter,
    Metric,
    MetricRegistry,
    MetricSetReportContext,
    MetricType,
    MILLISECOND,
    MonotoneCounter,
    OverallReportContext,
    ReportingResult,
    ScheduledMetricReporter,
    ScheduledMetricReporterOptions,
    Scheduler,
    StdClock,
    Tags,
    Timer,
    TimeUnit,
} from "inspector-metrics";

/**
 * Interface for getting a certain information using the specified emtric metadata -
 * e.g. name of the index, metric type, etc.
 */
export type MetricInfoDeterminator =
    (registry: MetricRegistry, metric: Metric, type: MetricType, date: Date) => string;

/**
 * Interface for building a document for a metric.
 */
export type MetricDocumentBuilder = (
    registry: MetricRegistry,
    metric: Metric,
    type: MetricType,
    date: Date,
    tags: Tags) => {};

/**
 * Options for {@link ElasticsearchMetricReporter}.
 *
 * @export
 * @interface ElasticsearchMetricReporterOption
 * @extends {ScheduledMetricReporterOptions}
 */
export interface ElasticsearchMetricReporterOption extends ScheduledMetricReporterOptions {
    /**
     * Elasticsearch client options.
     *
     * @type {ConfigOptions}
     * @memberof ElasticsearchMetricReporterOption
     */
    readonly clientOptions: ConfigOptions;
    /**
     * Logger instance used to report errors.
     *
     * @type {Logger}
     * @memberof ElasticsearchMetricReporterOption
     */
    log: Logger;
    /**
     * Used to get the name of the index.
     *
     * @type {MetricInfoDeterminator}
     * @memberof ElasticsearchMetricReporterOption
     */
    readonly indexnameDeterminator: MetricInfoDeterminator;
    /**
     * Used to get the type of the metric instance.
     *
     * @type {MetricInfoDeterminator}
     * @memberof ElasticsearchMetricReporterOption
     */
    readonly typeDeterminator: MetricInfoDeterminator;
    /**
     * Used to build the document for a metric.
     *
     * @type {MetricDocumentBuilder}
     * @memberof ElasticsearchMetricReporterOption
     */
    readonly metricDocumentBuilder: MetricDocumentBuilder;
}

/**
 * A MetricReporter extension used to publish metric values to elasticsearch.
 *
 * @export
 * @class ElasticsearchMetricReporter
 * @extends {MetricReporter}
 */
export class ElasticsearchMetricReporter extends ScheduledMetricReporter<ElasticsearchMetricReporterOption, Array<{}>> {

    /**
     * Returns a {@link MetricInfoDeterminator} that returns 'metric' as type.
     *
     * @static
     * @returns {MetricInfoDeterminator}
     * @memberof ElasticsearchMetricReporter
     */
    public static defaultTypeDeterminator(): MetricInfoDeterminator {
        return (registry: MetricRegistry, metric: Metric, type: MetricType, date: Date) => "metric";
    }

    /**
     * Returns a {@link MetricInfoDeterminator} that returns an indexname like '<baseName>-yyyy-mm-dd'.
     *
     * @static
     * @param {string} baseName The
     * @returns {MetricInfoDeterminator}
     * @memberof ElasticsearchMetricReporter
     */
    public static dailyIndex(baseName: string): MetricInfoDeterminator {
        return (registry: MetricRegistry, metric: Metric, type: MetricType, date: Date) => {
            const day = date.getDate();
            const dayPrefix: string = (day >= 10) ? "" : "0";
            const month = date.getMonth() + 1;
            const monthPrefix: string = (month >= 10) ? "" : "0";
            return `${baseName}-${date.getFullYear()}-${monthPrefix}${month}-${dayPrefix}${day}`;
        };
    }

    /**
     * Returns a {@link MetricDocumentBuilder} that builds an object for a metric like this:
     *
     * {
     *
     *  name: ..., // name of metric
     *
     *  group: ..., // group of metric
     *
     *  timestamp: ..., // timestamp from parameter
     *
     *  tags: ..., // combined tags from this reporter and the metric
     *
     *  values..., // metric specific values
     *
     *  type..., // metric type
     *
     * }
     *
     * @static
     * @returns {MetricDocumentBuilder}
     * @memberof ElasticsearchMetricReporter
     */
    public static defaultDocumentBuilder(): MetricDocumentBuilder {
        return (
            registry: MetricRegistry,
            metric: Metric,
            type: MetricType,
            timestamp: Date,
            tags: Tags) => {

            let values = null;

            if (metric instanceof MonotoneCounter) {
                values = ElasticsearchMetricReporter.getMonotoneCounterValues(metric);
            } else if (metric instanceof Counter) {
                values = ElasticsearchMetricReporter.getCounterValues(metric);
            } else if (metric instanceof Histogram) {
                values = ElasticsearchMetricReporter.getHistogramValues(metric);
            } else if (metric instanceof Meter) {
                values = ElasticsearchMetricReporter.getMeterValues(metric);
            } else if (metric instanceof Timer) {
                values = ElasticsearchMetricReporter.getTimerValues(metric);
            } else {
                values = ElasticsearchMetricReporter.getGaugeValue(metric as Gauge<any>);
            }

            if (values === null) {
                return null;
            }

            const name = metric.getName();
            const group = metric.getGroup();
            return { name, group, tags, timestamp, values, type };
        };
    }

    /**
     * Gets the values for the specified monotone counter metric.
     *
     * @static
     * @param {MonotoneCounter} counter
     * @returns {{}}
     * @memberof ElasticsearchMetricReporter
     */
    public static getMonotoneCounterValues(counter: MonotoneCounter): {} {
        const count = counter.getCount();
        if (!count || isNaN(count)) {
            return null;
        }
        return { count };
    }

    /**
     * Gets the values for the specified counter metric.
     *
     * @static
     * @param {Counter} counter
     * @returns {{}}
     * @memberof ElasticsearchMetricReporter
     */
    public static getCounterValues(counter: Counter): {} {
        const count = counter.getCount();
        if (!count || isNaN(count)) {
            return null;
        }
        return { count };
    }

    /**
     * Gets the values for the specified {Gauge} metric.
     *
     * @static
     * @param {Gauge<any>} gauge
     * @returns {{}}
     * @memberof ElasticsearchMetricReporter
     */
    public static getGaugeValue(gauge: Gauge<any>): {} {
        const value = gauge.getValue();
        if ((!value && value !== 0) || Number.isNaN(value)) {
            return null;
        }
        if (typeof value === "object") {
            return value;
        }
        return { value };
    }

    /**
     * Gets the values for the specified {Histogram} metric.
     *
     * @static
     * @param {Histogram} histogram
     * @returns {{}}
     * @memberof ElasticsearchMetricReporter
     */
    public static getHistogramValues(histogram: Histogram): {} {
        const value = histogram.getCount();
        if (!value || isNaN(value)) {
            return null;
        }
        const snapshot = histogram.getSnapshot();
        const values: any = {};

        values[`count`] = value;
        values[`max`] = this.getNumber(snapshot.getMax());
        values[`mean`] = this.getNumber(snapshot.getMean());
        values[`min`] = this.getNumber(snapshot.getMin());
        values[`p50`] = this.getNumber(snapshot.getMedian());
        values[`p75`] = this.getNumber(snapshot.get75thPercentile());
        values[`p95`] = this.getNumber(snapshot.get95thPercentile());
        values[`p98`] = this.getNumber(snapshot.get98thPercentile());
        values[`p99`] = this.getNumber(snapshot.get99thPercentile());
        values[`p999`] = this.getNumber(snapshot.get999thPercentile());
        values[`stddev`] = this.getNumber(snapshot.getStdDev());

        return values;
    }

    /**
     * Gets the values for the specified {Meter} metric.
     *
     * @static
     * @param {Meter} meter
     * @returns {{}}
     * @memberof ElasticsearchMetricReporter
     */
    public static getMeterValues(meter: Meter): {} {
        const value = meter.getCount();
        if (!value || isNaN(value)) {
            return null;
        }
        const values: any = {};

        values[`count`] = value;
        values[`m15_rate`] = this.getNumber(meter.get15MinuteRate());
        values[`m1_rate`] = this.getNumber(meter.get1MinuteRate());
        values[`m5_rate`] = this.getNumber(meter.get5MinuteRate());
        values[`mean_rate`] = this.getNumber(meter.getMeanRate());

        return values;
    }

    /**
     * Gets the values for the specified {Timer} metric.
     *
     * @static
     * @param {Timer} timer
     * @returns {{}}
     * @memberof ElasticsearchMetricReporter
     */
    public static getTimerValues(timer: Timer): {} {
        const value = timer.getCount();
        if (!value || isNaN(value)) {
            return null;
        }
        const snapshot = timer.getSnapshot();
        const values: any = {};

        values[`count`] = value;
        values[`m15_rate`] = this.getNumber(timer.get15MinuteRate());
        values[`m1_rate`] = this.getNumber(timer.get1MinuteRate());
        values[`m5_rate`] = this.getNumber(timer.get5MinuteRate());
        values[`max`] = this.getNumber(snapshot.getMax());
        values[`mean`] = this.getNumber(snapshot.getMean());
        values[`mean_rate`] = this.getNumber(timer.getMeanRate());
        values[`min`] = this.getNumber(snapshot.getMin());
        values[`p50`] = this.getNumber(snapshot.getMedian());
        values[`p75`] = this.getNumber(snapshot.get75thPercentile());
        values[`p95`] = this.getNumber(snapshot.get95thPercentile());
        values[`p98`] = this.getNumber(snapshot.get98thPercentile());
        values[`p99`] = this.getNumber(snapshot.get99thPercentile());
        values[`p999`] = this.getNumber(snapshot.get999thPercentile());
        values[`stddev`] = this.getNumber(snapshot.getStdDev());

        return values;
    }

    /**
     * Either gets 0 or the specifed value.
     *
     * @private
     * @param {number} value
     * @returns {number}
     * @memberof ElasticsearchMetricReporter
     */
    private static getNumber(value: number): number {
        if (isNaN(value)) {
            return 0;
        }
        return value;
    }

    /**
     * Metadata for the logger.
     *
     * @private
     * @type {*}
     * @memberof ElasticsearchMetricReporter
     */
    private logMetadata: any;
    /**
     * Elasticsearch client used to do reporting.
     *
     * @private
     * @type {Client}
     * @memberof ElasticsearchMetricReporter
     */
    private client: Client;

    /**
     * Creates an instance of ElasticsearchMetricReporter.
     */
    public constructor(
        {
            clientOptions,
            metricDocumentBuilder = ElasticsearchMetricReporter.defaultDocumentBuilder(),
            indexnameDeterminator = ElasticsearchMetricReporter.dailyIndex("metric"),
            typeDeterminator = ElasticsearchMetricReporter.defaultTypeDeterminator(),
            log = console,
            reportInterval = 1000,
            unit = MILLISECOND,
            clock = new StdClock(),
            scheduler = setInterval,
            minReportingTimeout = 1,
            tags = new Map(),
        }: {
                /**
                 * Elasticsearch client options.
                 * @type {ConfigOptions}
                 */
                clientOptions: ConfigOptions,
                /**
                 * Used to build the document for a metric.
                 * @type {MetricDocumentBuilder}
                 */
                metricDocumentBuilder?: MetricDocumentBuilder,
                /**
                 * Used to get the name of the index.
                 * @type {MetricInfoDeterminator}
                 */
                indexnameDeterminator?: MetricInfoDeterminator,
                /**
                 * Used to get the type of the metric instance.
                 * @type {MetricInfoDeterminator}
                 */
                typeDeterminator?: MetricInfoDeterminator,
                /**
                 * The logger instance used to report metrics.
                 * @type {Logger}
                 */
                log?: Logger,
                /**
                 * Reporting interval in the time-unit of {@link #unit}.
                 * @type {number}
                 */
                reportInterval?: number;
                /**
                 * The time-unit of the reporting interval.
                 * @type {TimeUnit}
                 */
                unit?: TimeUnit;
                /**
                 * The clock instance used determine the current time.
                 * @type {Clock}
                 */
                clock?: Clock;
                /**
                 * The scheduler function used to trigger reporting.
                 * @type {Scheduler}
                 */
                scheduler?: Scheduler;
                /**
                 * The timeout in which a metrics gets reported wether it's value has changed or not.
                 * @type {number}
                 */
                minReportingTimeout?: number;
                /**
                 * Common tags for this reporter instance.
                 * @type {Map<string, string>}
                 */
                tags?: Map<string, string>;
            }) {
        super({
            clientOptions,
            clock,
            indexnameDeterminator,
            log,
            metricDocumentBuilder,
            minReportingTimeout,
            reportInterval,
            scheduler,
            tags,
            typeDeterminator,
            unit,
        });

        this.logMetadata = {
            reportInterval,
            tags,
            unit,
        };

        this.client = new Client(clientOptions);
    }

    /**
     * Gets the logger instance.
     *
     * @returns {Logger}
     * @memberof ElasticsearchMetricReporter
     */
    public getLog(): Logger {
        return this.options.log;
    }

    /**
     * Sets the logger instance.
     *
     * @param {Logger} log
     * @memberof ElasticsearchMetricReporter
     */
    public setLog(log: Logger): void {
        this.options.log = log;
    }

    /**
     * Reports an {@link Event}.
     *
     * @param {Event} event
     * @returns {Promise<TEvent>}
     * @memberof ElasticsearchMetricReporter
     */
    public async reportEvent<TEventData, TEvent extends Event<TEventData>>(event: TEvent): Promise<TEvent> {
        const result = this.reportGauge(event, {
            date: event.getTime(),
            metrics: [],
            overallCtx: null,
            registry: null,
            type: "gauge",
        });

        if (result) {
            await this.handleResults(null, null, event.getTime(), "gauge", [{
                metric: event,
                result,
            }]);
        }

        return event;
    }

    /**
     * Does nothing
     *
     * @returns {Promise<void>}
     * @memberof ElasticsearchMetricReporter
     */
    public async flushEvents(): Promise<void> {
    }

    /**
     * Send the combinations of index and document to the elasticsearch cluster
     * using the bulk method of the elasticsearch client.
     *
     * @protected
     * @param {MetricRegistry} registry
     * @param {Date} date
     * @param {MetricType} type
     * @param {Array<ReportingResult<any, any[]>>} results
     * @returns {Promise<void>}
     * @memberof ElasticsearchMetricReporter
     */
    protected handleResults(
        ctx: OverallReportContext,
        registry: MetricRegistry,
        date: Date,
        type: MetricType,
        results: Array<ReportingResult<any, any[]>>): Promise<void> {
        const body = results
            .map((result) => result.result)
            .reduce((p, c) => p.concat(c), []);

        if (!body || body.length === 0) {
            return Promise.resolve();
        }

        return this.client.bulk({ body })
            .then((response) => {
                if (this.options.log) {
                    this.options.log.debug(
                        `took ${response.took}ms to write ${type} metrics - errors ${response.errors}`,
                        this.logMetadata,
                    );
                }
            })
            .catch((reason) => {
                if (this.options.log) {
                    this.options.log
                        .error(`error writing ${type} metrics - reason: ${reason}`, reason, this.logMetadata);
                }
            });
    }

    /**
     * Generalized reporting method of all types of metric instances.
     * Builds the index configuration document and the metric document.
     *
     * @protected
     * @param {Metric} metric
     * @param {ReportingContext<Metric>} ctx
     * @returns {Array<{}>}
     * @memberof ElasticsearchMetricReporter
     */
    protected reportMetric(
        metric: Metric, ctx: MetricSetReportContext<Metric>): Array<{}> {
        const document = this.options.metricDocumentBuilder(
            ctx.registry, metric, ctx.type, ctx.date, this.buildTags(ctx.registry, metric));
        if (!!document) {
            // tslint:disable-next-line:variable-name
            const _index = this.options.indexnameDeterminator(ctx.registry, metric, ctx.type, ctx.date);
            // tslint:disable-next-line:variable-name
            const _type = this.options.typeDeterminator(ctx.registry, metric, ctx.type, ctx.date);
            return [
                { index: { _index, _type } },
                document,
            ];
        }
        return [];
    }

    /**
     * Calls {@link #reportMetric} with the specified arguments.
     *
     * @protected
     * @param {(MonotoneCounter | Counter)} counter
     * @param {(ReportingContext<MonotoneCounter | Counter>)} ctx
     * @returns {Array<{}>}
     * @memberof ElasticsearchMetricReporter
     */
    protected reportCounter(
        counter: MonotoneCounter | Counter, ctx: MetricSetReportContext<MonotoneCounter | Counter>): Array<{}> {
        return this.reportMetric(counter, ctx);
    }

    /**
     * Calls {@link #reportMetric} with the specified arguments.
     *
     * @protected
     * @param {Gauge<any>} gauge
     * @param {ReportingContext<Gauge<any>>} ctx
     * @returns {Array<{}>}
     * @memberof ElasticsearchMetricReporter
     */
    protected reportGauge(gauge: Gauge<any>, ctx: MetricSetReportContext<Gauge<any>>): Array<{}> {
        return this.reportMetric(gauge, ctx);
    }

    /**
     * Calls {@link #reportMetric} with the specified arguments.
     *
     * @protected
     * @param {Histogram} histogram
     * @param {ReportingContext<Histogram>} ctx
     * @returns {Array<{}>}
     * @memberof ElasticsearchMetricReporter
     */
    protected reportHistogram(histogram: Histogram, ctx: MetricSetReportContext<Histogram>): Array<{}> {
        return this.reportMetric(histogram, ctx);
    }

    /**
     * Calls {@link #reportMetric} with the specified arguments.
     *
     * @protected
     * @param {Meter} meter
     * @param {ReportingContext<Meter>} ctx
     * @returns {Array<{}>}
     * @memberof ElasticsearchMetricReporter
     */
    protected reportMeter(meter: Meter, ctx: MetricSetReportContext<Meter>): Array<{}> {
        return this.reportMetric(meter, ctx);
    }

    /**
     * Calls {@link #reportMetric} with the specified arguments.
     *
     * @protected
     * @param {Timer} timer
     * @param {ReportingContext<Timer>} ctx
     * @returns {Array<{}>}
     * @memberof ElasticsearchMetricReporter
     */
    protected reportTimer(timer: Timer, ctx: MetricSetReportContext<Timer>): Array<{}> {
        return this.reportMetric(timer, ctx);
    }

}
